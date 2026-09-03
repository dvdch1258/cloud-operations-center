import base64
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

from app.core.config import settings


TRACE_ID_PATTERN = re.compile(
    r"^[0-9a-fA-F]{32}$"
)


def _normalize_trace_id(
    value: str | None,
) -> str | None:
    if not value:
        return None

    value = str(value).strip().lower()

    if not re.fullmatch(
        r"[0-9a-f]{1,32}",
        value,
    ):
        return None

    return value.zfill(32)


class TempoQueryError(RuntimeError):
    pass


class TempoTraceNotFound(TempoQueryError):
    pass


def _request_json(
    path: str,
    params: dict | None = None,
) -> dict:
    base = settings.tempo_url.rstrip("/")

    url = f"{base}{path}"

    if params:
        url += (
            "?"
            + urllib.parse.urlencode(params)
        )

    try:
        with urllib.request.urlopen(
            url,
            timeout=5,
        ) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise TempoTraceNotFound(
                "Traza no encontrada"
            ) from exc

        raise TempoQueryError(
            f"Tempo devolvió HTTP {exc.code}"
        ) from exc
    except Exception as exc:
        raise TempoQueryError(
            f"No se pudo consultar Tempo: {exc}"
        ) from exc


def _otlp_id_to_hex(
    value: str | None,
) -> str | None:
    if not value:
        return None

    value = str(value).strip()

    if re.fullmatch(
        r"[0-9a-fA-F]+",
        value,
    ):
        return value.lower()

    try:
        return base64.b64decode(
            value
        ).hex()
    except Exception:
        return None


def _attribute_value(
    value: dict | None,
):
    if not value:
        return None

    for key in (
        "stringValue",
        "intValue",
        "doubleValue",
        "boolValue",
    ):
        if key in value:
            return value[key]

    return None


def _attributes_to_dict(
    attributes: list | None,
) -> dict:
    result = {}

    for item in attributes or []:
        key = item.get("key")

        if not key:
            continue

        result[key] = _attribute_value(
            item.get("value")
        )

    return result


def _resource_service_name(
    resource: dict | None,
) -> str:
    attributes = _attributes_to_dict(
        (resource or {}).get(
            "attributes"
        )
    )

    return (
        attributes.get("service.name")
        or "unknown"
    )


def _span_status(
    span: dict,
    attributes: dict,
) -> str:
    status = span.get("status") or {}

    raw_code = str(
        status.get("code", "")
    ).upper()

    if "ERROR" in raw_code:
        return "error"

    http_status = attributes.get(
        "http.status_code"
    )

    try:
        http_status = int(http_status)
    except (TypeError, ValueError):
        http_status = None

    if http_status is not None:
        if http_status >= 500:
            return "error"

        if http_status >= 400:
            return "warning"

    return "ok"


def _timestamp_from_ns(
    timestamp_ns: int,
) -> datetime:
    return datetime.fromtimestamp(
        timestamp_ns / 1_000_000_000,
        tz=timezone.utc,
    )


def get_observability_traces(
    hours: int = 1,
    limit: int = 50,
    service: str | None = None,
    *,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> dict:
    end = end_at if end_at is not None else datetime.now(timezone.utc)
    start = start_at if start_at is not None else end - timedelta(hours=hours)

    params = {
        "start": int(
            start.timestamp()
        ),
        "end": int(
            end.timestamp()
        ),
        "limit": limit,
    }

    if service:
        params["tags"] = (
            f"service.name={service}"
        )

    payload = _request_json(
        "/api/search",
        params,
    )

    traces = []

    for trace in payload.get(
        "traces",
        [],
    ):
        trace_id = _normalize_trace_id(
            trace.get("traceID")
        )

        if trace_id is None:
            continue

        start_ns = int(
            trace.get(
                "startTimeUnixNano",
                0,
            )
            or 0
        )

        traces.append(
            {
                "trace_id": trace_id,
                "service": (
                    trace.get(
                        "rootServiceName"
                    )
                    or "unknown"
                ),
                "operation": (
                    trace.get(
                        "rootTraceName"
                    )
                    or "unknown"
                ),
                "started_at": (
                    _timestamp_from_ns(
                        start_ns
                    )
                    if start_ns
                    else None
                ),
                "duration_ms": round(
                    float(
                        trace.get(
                            "durationMs",
                            0,
                        )
                        or 0
                    ),
                    3,
                ),
            }
        )

    return {
        "period_hours": hours,
        "total": len(traces),
        "traces": traces,
    }


def get_observability_trace(
    trace_id: str,
) -> dict:
    if not TRACE_ID_PATTERN.fullmatch(
        trace_id
    ):
        raise ValueError(
            "trace_id no válido"
        )

    payload = _request_json(
        f"/api/traces/{trace_id}"
    )

    spans = []

    for batch in payload.get(
        "batches",
        [],
    ):
        service_name = (
            _resource_service_name(
                batch.get("resource")
            )
        )

        for scope in batch.get(
            "scopeSpans",
            [],
        ):
            for span in scope.get(
                "spans",
                [],
            ):
                attributes = (
                    _attributes_to_dict(
                        span.get(
                            "attributes"
                        )
                    )
                )

                start_ns = int(
                    span.get(
                        "startTimeUnixNano",
                        0,
                    )
                    or 0
                )

                end_ns = int(
                    span.get(
                        "endTimeUnixNano",
                        0,
                    )
                    or 0
                )

                duration_ms = (
                    max(
                        0,
                        end_ns - start_ns,
                    )
                    / 1_000_000
                )

                spans.append(
                    {
                        "span_id": (
                            _otlp_id_to_hex(
                                span.get(
                                    "spanId"
                                )
                            )
                        ),
                        "parent_span_id": (
                            _otlp_id_to_hex(
                                span.get(
                                    "parentSpanId"
                                )
                            )
                        ),
                        "service": service_name,
                        "name": (
                            span.get("name")
                            or "unknown"
                        ),
                        "kind": (
                            span.get("kind")
                            or "unknown"
                        ),
                        "started_at": (
                            _timestamp_from_ns(
                                start_ns
                            )
                            if start_ns
                            else None
                        ),
                        "duration_ms": round(
                            duration_ms,
                            3,
                        ),
                        "status": _span_status(
                            span,
                            attributes,
                        ),
                        "http_method": (
                            attributes.get(
                                "http.method"
                            )
                        ),
                        "http_target": (
                            attributes.get(
                                "http.target"
                            )
                        ),
                        "http_status_code": (
                            attributes.get(
                                "http.status_code"
                            )
                        ),
                        "_start_ns": start_ns,
                        "_end_ns": end_ns,
                    }
                )

    spans.sort(
        key=lambda item: item[
            "_start_ns"
        ]
    )

    if not spans:
        raise TempoTraceNotFound(
            "La traza no contiene spans"
        )

    root = next(
        (
            span
            for span in spans
            if not span[
                "parent_span_id"
            ]
        ),
        spans[0],
    )

    start_ns = min(
        span["_start_ns"]
        for span in spans
        if span["_start_ns"]
    )

    end_ns = max(
        span["_end_ns"]
        for span in spans
        if span["_end_ns"]
    )

    trace_status = "ok"

    if any(
        span["status"] == "error"
        for span in spans
    ):
        trace_status = "error"
    elif any(
        span["status"] == "warning"
        for span in spans
    ):
        trace_status = "warning"

    for span in spans:
        span.pop("_start_ns", None)
        span.pop("_end_ns", None)

    return {
        "trace_id": trace_id.lower(),
        "service": root["service"],
        "operation": root["name"],
        "started_at": (
            _timestamp_from_ns(
                start_ns
            )
        ),
        "duration_ms": round(
            (
                end_ns - start_ns
            )
            / 1_000_000,
            3,
        ),
        "status": trace_status,
        "spans_total": len(spans),
        "spans": spans,
    }
