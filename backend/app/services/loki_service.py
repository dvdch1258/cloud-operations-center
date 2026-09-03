import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

from app.core.config import settings


LOG_LEVEL_PATTERN = re.compile(
    r"^(?:"
    r"\d{4}-\d{2}-\d{2}\s+"
    r"\d{2}:\d{2}:\d{2}(?:,\d+)?\s+"
    r")?"
    r"(DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\b",
    re.IGNORECASE,
)

HTTP_STATUS_PATTERN = re.compile(
    r'"\s(?P<status>[1-5]\d{2})(?:\s|$)'
)

TRACE_ID_PATTERN = re.compile(
    r"\btrace_id=([0-9a-fA-F]{32})\b"
)

SPAN_ID_PATTERN = re.compile(
    r"\bspan_id=([0-9a-fA-F]{16})\b"
)


class LokiQueryError(RuntimeError):
    pass


def _normalize_level(
    value: str | None,
) -> str | None:
    if not value:
        return None

    level = str(value).strip().lower()

    aliases = {
        "warn": "warning",
        "fatal": "critical",
    }

    level = aliases.get(level, level)

    if level in {
        "debug",
        "info",
        "warning",
        "error",
        "critical",
    }:
        return level

    return None


def _parse_json_log(
    message: str,
) -> dict | None:
    try:
        payload = json.loads(message)
    except (TypeError, ValueError):
        return None

    if not isinstance(payload, dict):
        return None

    return payload


def _detect_level(
    message: str,
) -> str:
    payload = _parse_json_log(message)

    if payload:
        for key in (
            "level",
            "severity",
            "severity_text",
        ):
            level = _normalize_level(
                payload.get(key)
            )

            if level:
                return level

    match = LOG_LEVEL_PATTERN.search(message)

    if match:
        return (
            _normalize_level(match.group(1))
            or "unknown"
        )

    http_match = HTTP_STATUS_PATTERN.search(
        message
    )

    if http_match:
        status = int(
            http_match.group("status")
        )

        if status >= 500:
            return "error"

        if status >= 400:
            return "warning"

        return "info"

    return "unknown"


def _extract_context(
    message: str,
) -> tuple[str | None, str | None]:
    payload = _parse_json_log(message)

    trace_id = None
    span_id = None

    if payload:
        raw_trace_id = payload.get("trace_id")
        raw_span_id = payload.get("span_id")

        if raw_trace_id:
            trace_id = str(raw_trace_id)

        if raw_span_id:
            span_id = str(raw_span_id)

    if trace_id is None:
        match = TRACE_ID_PATTERN.search(message)

        if match:
            trace_id = match.group(1)

    if span_id is None:
        match = SPAN_ID_PATTERN.search(message)

        if match:
            span_id = match.group(1)

    return trace_id, span_id


def _timestamp_from_ns(
    raw_timestamp: str,
) -> datetime:
    timestamp_ns = int(raw_timestamp)

    return datetime.fromtimestamp(
        timestamp_ns / 1_000_000_000,
        tz=timezone.utc,
    )


def _build_query(
    service: str | None,
    search: str | None,
) -> str:
    selectors = [
        f'namespace={json.dumps("cloud-ops")}',
    ]

    if service:
        selectors.append(
            "service_name="
            + json.dumps(service)
        )

    query = (
        "{"
        + ",".join(selectors)
        + "}"
    )

    if search:
        query += " |= " + json.dumps(search)

    return query


def _query_range(
    query: str,
    start: datetime,
    end: datetime,
    limit: int,
) -> list[dict]:
    base = settings.loki_url.rstrip("/")

    params = {
        "query": query,
        "start": str(
            int(
                start.timestamp()
                * 1_000_000_000
            )
        ),
        "end": str(
            int(
                end.timestamp()
                * 1_000_000_000
            )
        ),
        "limit": limit,
        "direction": "backward",
    }

    url = (
        f"{base}/loki/api/v1/query_range?"
        + urllib.parse.urlencode(params)
    )

    try:
        with urllib.request.urlopen(
            url,
            timeout=5,
        ) as response:
            payload = json.load(response)
    except Exception as exc:
        raise LokiQueryError(
            f"No se pudo consultar Loki: {exc}"
        ) from exc

    if payload.get("status") != "success":
        raise LokiQueryError(
            "Loki devolvió una respuesta no válida"
        )

    return (
        payload.get("data", {})
        .get("result", [])
    )


def get_observability_logs(
    hours: int = 1,
    service: str | None = None,
    level: str | None = None,
    search: str | None = None,
    limit: int = 100,
    *,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> dict:
    end = end_at if end_at is not None else datetime.now(timezone.utc)
    start = start_at if start_at is not None else end - timedelta(hours=hours)

    normalized_level = (
        _normalize_level(level)
        if level
        else None
    )

    fetch_limit = limit

    if normalized_level:
        fetch_limit = min(
            max(limit * 5, limit),
            1000,
        )

    query = _build_query(
        service,
        search,
    )

    streams = _query_range(
        query,
        start,
        end,
        fetch_limit,
    )

    logs = []

    for stream in streams:
        labels = stream.get(
            "stream",
            {},
        )

        service_name = (
            labels.get("service_name")
            or labels.get("app")
            or labels.get("container")
            or "unknown"
        )

        for raw_timestamp, message in stream.get(
            "values",
            [],
        ):
            detected_level = _detect_level(
                message
            )

            if (
                normalized_level
                and detected_level
                != normalized_level
            ):
                continue

            trace_id, span_id = (
                _extract_context(message)
            )

            logs.append(
                {
                    "timestamp": (
                        _timestamp_from_ns(
                            raw_timestamp
                        )
                    ),
                    "service": service_name,
                    "namespace": labels.get(
                        "namespace"
                    ),
                    "pod": labels.get("pod"),
                    "container": labels.get(
                        "container"
                    ),
                    "level": detected_level,
                    "message": message,
                    "trace_id": trace_id,
                    "span_id": span_id,
                    "_timestamp_ns": int(
                        raw_timestamp
                    ),
                }
            )

    logs.sort(
        key=lambda item: item[
            "_timestamp_ns"
        ],
        reverse=True,
    )

    logs = logs[:limit]

    for item in logs:
        item.pop("_timestamp_ns", None)

    return {
        "period_hours": hours,
        "service": service,
        "level": normalized_level,
        "search": search,
        "limit": limit,
        "total": len(logs),
        "logs": logs,
    }
