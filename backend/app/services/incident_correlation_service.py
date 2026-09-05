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
    get_observability_traces,
)


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

    service_name = (
        service.name
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
            service=service_name,
            search=(
                None
                if service_name
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

    if service_name:
        try:
            trace_result = get_observability_traces(
                service=service_name,
                limit=trace_limit,
                start_at=window["start_at"],
                end_at=window["end_at"],
            )

            traces = list(
                trace_result.get("traces") or []
            )

        except TempoQueryError:
            tempo_status = "unavailable"

    else:
        tempo_status = "skipped"

    errors_total = sum(
        str(log.get("level") or "").lower()
        in {"error", "critical", "fatal"}
        for log in logs
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
        },
        "logs": logs,
        "traces": traces,
        "captured_traces": captured_traces,
        "sources": {
            "loki": loki_status,
            "tempo": tempo_status,
        },
    }
