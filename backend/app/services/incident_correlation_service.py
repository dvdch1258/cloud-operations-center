import re
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.service import Service
from app.services.incident_detail_service import (
    get_captured_traces,
    incident_window,
)
from app.services.loki_service import (
    LokiQueryError,
    get_observability_logs,
)
from app.services.tempo_service import (
    TempoQueryError,
    get_observability_trace,
    get_observability_traces,
)


RANKED_SIGNALS_LIMIT = 8
TRACE_DETAIL_LIMIT = 8

TRACE_ID_PATTERN = re.compile(
    r"^[0-9a-fA-F]{32}$"
)


def _as_utc(
    value,
) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, str):
        normalized = value.strip()

        if normalized.endswith("Z"):
            normalized = (
                normalized[:-1]
                + "+00:00"
            )

        try:
            value = datetime.fromisoformat(
                normalized
            )
        except ValueError:
            return None

    if not isinstance(value, datetime):
        return None

    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc
        )

    return value.astimezone(
        timezone.utc
    )


def _normalize_trace_id(
    value,
) -> str | None:
    if value is None:
        return None

    value = str(value).strip()

    if not TRACE_ID_PATTERN.fullmatch(
        value
    ):
        return None

    if not value.strip("0"):
        return None

    return value.lower()


def _proximity_score(
    incident,
    timestamp,
) -> tuple[int, list[str]]:
    timestamp = _as_utc(timestamp)

    if timestamp is None:
        return 0, []

    boundaries = [
        _as_utc(incident.created_at),
        _as_utc(incident.resolved_at),
    ]

    boundaries = [
        value
        for value in boundaries
        if value is not None
    ]

    if not boundaries:
        return 0, []

    distance = min(
        abs(
            (
                timestamp
                - boundary
            ).total_seconds()
        )
        for boundary in boundaries
    )

    if distance <= 30:
        return (
            30,
            [
                "Muy próxima al inicio "
                "o resolución del incidente"
            ],
        )

    if distance <= 120:
        return (
            15,
            [
                "Próxima al inicio "
                "o resolución del incidente"
            ],
        )

    return 0, []


def _operation_score(
    operation,
) -> tuple[int, list[str]]:
    operation = str(
        operation or ""
    ).strip()

    if not operation:
        return 0, []

    lowered = operation.lower()
    upper = operation.upper()

    if "/metrics" in lowered:
        return (
            -45,
            [
                "Operación rutinaria "
                "de métricas"
            ],
        )

    if "/health" in lowered:
        return (
            -35,
            [
                "Operación rutinaria "
                "de health check"
            ],
        )

    if upper.startswith(
        (
            "POST ",
            "PUT ",
            "PATCH ",
            "DELETE ",
        )
    ):
        return (
            20,
            [
                "Operación de escritura"
            ],
        )

    return 0, []


def _duration_score(
    duration_ms,
) -> tuple[int, list[str]]:
    try:
        duration_ms = float(
            duration_ms
        )
    except (TypeError, ValueError):
        return 0, []

    if duration_ms >= 1000:
        return (
            15,
            [
                "Duración superior "
                "a 1 segundo"
            ],
        )

    if duration_ms >= 500:
        return (
            8,
            [
                "Duración superior "
                "a 500 ms"
            ],
        )

    return 0, []


def _signal_severity(
    score: int,
) -> str:
    if score >= 70:
        return "high"

    if score >= 30:
        return "medium"

    return "low"


def _deduplicate_reasons(
    reasons: list[str],
) -> list[str]:
    return list(
        dict.fromkeys(reasons)
    )


def _trace_pre_score(
    incident,
    trace,
    captured_ids: set[str],
) -> tuple[int, list[str]]:
    score = 0
    reasons = []

    trace_id = _normalize_trace_id(
        trace.get("trace_id")
    )

    if trace_id in captured_ids:
        score += 100
        reasons.append(
            "Traza capturada directamente "
            "por el incidente"
        )

    operation_score, operation_reasons = (
        _operation_score(
            trace.get("operation")
        )
    )
    score += operation_score
    reasons.extend(
        operation_reasons
    )

    duration_score, duration_reasons = (
        _duration_score(
            trace.get("duration_ms")
        )
    )
    score += duration_score
    reasons.extend(
        duration_reasons
    )

    proximity_score, proximity_reasons = (
        _proximity_score(
            incident,
            trace.get("started_at"),
        )
    )
    score += proximity_score
    reasons.extend(
        proximity_reasons
    )

    return (
        score,
        _deduplicate_reasons(
            reasons
        ),
    )


def _http_status_codes(
    detail,
) -> list[int]:
    result = []

    if detail is None:
        return result

    for span in (
        detail.get("spans") or []
    ):
        raw_status = span.get(
            "http_status_code"
        )

        try:
            status = int(raw_status)
        except (TypeError, ValueError):
            continue

        result.append(status)

    return sorted(
        set(result)
    )


def _build_trace_signal(
    incident,
    trace,
    captured_ids: set[str],
    detail=None,
):
    scoring_trace = dict(trace)

    if detail is not None:
        for field in (
            "service",
            "operation",
            "started_at",
            "duration_ms",
        ):
            if detail.get(field) is not None:
                scoring_trace[field] = detail[field]

    score, reasons = _trace_pre_score(
        incident,
        scoring_trace,
        captured_ids,
    )

    status = None
    spans_total = None
    http_status_codes = []

    if detail is not None:
        status = detail.get("status")
        spans_total = detail.get(
            "spans_total"
        )

        http_status_codes = (
            _http_status_codes(
                detail
            )
        )

        if status == "error":
            score += 70
            reasons.append(
                "La traza contiene "
                "spans con error"
            )
        elif status == "warning":
            score += 35
            reasons.append(
                "La traza contiene "
                "spans con advertencia"
            )

        if any(
            code >= 500
            for code in http_status_codes
        ):
            score += 70
            reasons.append(
                "Se detectó una respuesta "
                "HTTP 5xx"
            )
        elif any(
            code >= 400
            for code in http_status_codes
        ):
            score += 35
            reasons.append(
                "Se detectó una respuesta "
                "HTTP 4xx"
            )

    if score <= 0:
        return None

    effective = scoring_trace

    trace_id = _normalize_trace_id(
        trace.get("trace_id")
    )

    operation = (
        effective.get("operation")
        or trace.get("operation")
        or "Traza relacionada"
    )

    return {
        "kind": "trace",
        "source": (
            "tempo"
            if trace.get("_tempo")
            or detail is not None
            else "incident"
        ),
        "score": score,
        "severity": _signal_severity(
            score
        ),
        "title": operation,
        "reasons": (
            _deduplicate_reasons(
                reasons
            )
        ),
        "trace_id": trace_id,
        "started_at": (
            effective.get("started_at")
            or trace.get("started_at")
        ),
        "service": (
            effective.get("service")
            or trace.get("service")
        ),
        "operation": operation,
        "duration_ms": (
            effective.get("duration_ms")
            if effective.get(
                "duration_ms"
            ) is not None
            else trace.get(
                "duration_ms"
            )
        ),
        "status": status,
        "level": None,
        "message": None,
        "spans_total": spans_total,
        "http_status_codes": (
            http_status_codes
        ),
    }


def _build_log_signal(
    incident,
    log,
    captured_ids: set[str],
):
    level = str(
        log.get("level") or ""
    ).lower()

    level_scores = {
        "fatal": 80,
        "critical": 80,
        "error": 70,
        "warning": 30,
        "warn": 30,
    }

    score = level_scores.get(
        level,
        0,
    )
    reasons = []

    if score:
        reasons.append(
            f"Log con nivel {level}"
        )

    trace_id = _normalize_trace_id(
        log.get("trace_id")
    )

    if (
        trace_id is not None
        and trace_id in captured_ids
    ):
        score += 20
        reasons.append(
            "El log pertenece a una "
            "traza capturada"
        )

    if score <= 0:
        return None

    proximity_score, proximity_reasons = (
        _proximity_score(
            incident,
            log.get("timestamp"),
        )
    )

    score += proximity_score
    reasons.extend(
        proximity_reasons
    )

    message = str(
        log.get("message") or ""
    ).strip()

    title = (
        message.splitlines()[0][:160]
        if message
        else f"Log {level}"
    )

    return {
        "kind": "log",
        "source": "loki",
        "score": score,
        "severity": _signal_severity(
            score
        ),
        "title": title,
        "reasons": (
            _deduplicate_reasons(
                reasons
            )
        ),
        "trace_id": trace_id,
        "started_at": log.get(
            "timestamp"
        ),
        "service": log.get(
            "service"
        ),
        "operation": None,
        "duration_ms": None,
        "status": None,
        "level": level or None,
        "message": message or None,
        "spans_total": None,
        "http_status_codes": [],
    }


def _rank_signals(
    incident,
    logs,
    traces,
    captured_traces,
    *,
    tempo_available: bool,
) -> list[dict]:
    captured_ids = {
        trace_id
        for trace_id in (
            _normalize_trace_id(
                item.get("trace_id")
            )
            for item in captured_traces
        )
        if trace_id is not None
    }

    trace_map = {}

    for item in traces:
        trace_id = _normalize_trace_id(
            item.get("trace_id")
        )

        if trace_id is None:
            continue

        candidate = dict(item)
        candidate["trace_id"] = trace_id
        candidate["_tempo"] = True

        trace_map[trace_id] = (
            candidate
        )

    for item in captured_traces:
        trace_id = _normalize_trace_id(
            item.get("trace_id")
        )

        if trace_id is None:
            continue

        existing = trace_map.get(
            trace_id
        )

        if existing is None:
            existing = dict(item)
            existing["trace_id"] = (
                trace_id
            )
            existing["_tempo"] = False

            trace_map[trace_id] = (
                existing
            )

    pre_ranked = []

    for trace_item in (
        trace_map.values()
    ):
        score, _ = _trace_pre_score(
            incident,
            trace_item,
            captured_ids,
        )

        # A zero-score trace can still hide an HTTP 5xx/error
        # that is only visible after loading its spans.
        # Negative scores represent routine/noisy operations such
        # as health checks or metrics and should not consume one
        # of the limited Tempo detail lookups.
        if score >= 0:
            pre_ranked.append(
                (
                    score,
                    trace_item,
                )
            )

    pre_ranked.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    detail_by_trace_id = {}

    if tempo_available:
        for _, trace_item in (
            pre_ranked[
                :TRACE_DETAIL_LIMIT
            ]
        ):
            trace_id = trace_item[
                "trace_id"
            ]

            try:
                detail_by_trace_id[
                    trace_id
                ] = (
                    get_observability_trace(
                        trace_id
                    )
                )
            except TempoQueryError:
                # Detail enrichment is optional.
                # Keep the pre-ranked signal.
                continue

    signals = []

    for _, trace_item in pre_ranked:
        trace_id = trace_item[
            "trace_id"
        ]

        signal = _build_trace_signal(
            incident,
            trace_item,
            captured_ids,
            detail=(
                detail_by_trace_id.get(
                    trace_id
                )
            ),
        )

        if signal is not None:
            signals.append(signal)

    for log in logs:
        signal = _build_log_signal(
            incident,
            log,
            captured_ids,
        )

        if signal is not None:
            signals.append(signal)

    signals.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return signals[
        :RANKED_SIGNALS_LIMIT
    ]


def get_incident_correlation(
    db: Session,
    incident,
    *,
    log_limit: int = 100,
    trace_limit: int = 50,
) -> dict:
    """
    Build a read-only operational correlation view for an incident.

    Loki and Tempo are independent sources. A failure in one source must not
    make the complete correlation endpoint unavailable.
    """
    window = incident_window(incident)

    service = (
        db.get(Service, incident.service_id)
        if incident.service_id
        else None
    )

    observability_name = (
        service.observability_name
        if service is not None
        else None
    )

    captured_traces = get_captured_traces(
        db,
        incident.id,
        trace_limit,
    )

    logs = []
    traces = []

    loki_status = "available"
    tempo_status = "available"

    try:
        log_result = get_observability_logs(
            service=observability_name,
            search=(
                None
                if observability_name
                else f"incident_id={incident.id} "
            ),
            limit=log_limit,
            start_at=window["start_at"],
            end_at=window["end_at"],
        )

        logs = list(
            log_result.get("logs") or []
        )

    except LokiQueryError:
        loki_status = "unavailable"

    if observability_name:
        try:
            trace_result = (
                get_observability_traces(
                    service=observability_name,
                    limit=trace_limit,
                    start_at=window["start_at"],
                    end_at=window["end_at"],
                )
            )

            traces = list(
                trace_result.get(
                    "traces"
                )
                or []
            )

        except TempoQueryError:
            tempo_status = (
                "unavailable"
            )
    else:
        tempo_status = "skipped"

    errors_total = sum(
        str(
            log.get("level") or ""
        ).lower()
        in {
            "error",
            "critical",
            "fatal",
        }
        for log in logs
    )

    ranked_signals = _rank_signals(
        incident,
        logs,
        traces,
        captured_traces,
        tempo_available=(
            tempo_status == "available"
        ),
    )

    return {
        "incident_id": incident.id,
        "service": service,
        "window": window,
        "summary": {
            "logs_total": len(logs),
            "errors_total": errors_total,
            "traces_total": len(traces),
            "captured_traces_total": len(
                captured_traces
            ),
            "signals_total": len(
                ranked_signals
            ),
        },
        "ranked_signals": ranked_signals,
        "logs": logs,
        "traces": traces,
        "captured_traces": captured_traces,
        "sources": {
            "loki": loki_status,
            "tempo": tempo_status,
        },
    }
