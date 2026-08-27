import json
import math
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from app.core.config import settings


REQUESTS_PER_SECOND_QUERY = (
    'sum(rate(http_requests_total{job="backend"}[5m]))'
)

ERROR_RATE_PERCENT_QUERY = (
    '100 * '
    '('
    'sum(rate(http_requests_total'
    '{job="backend",status="5xx"}[5m])) '
    'or vector(0)'
    ') '
    '/ '
    'clamp_min('
    'sum(rate(http_requests_total{job="backend"}[5m])), '
    '0.000001'
    ')'
)

LATENCY_P95_SECONDS_QUERY = (
    'histogram_quantile('
    '0.95, '
    'sum(rate('
    'http_request_duration_highr_seconds_bucket'
    '{job="backend"}[5m]'
    ')) by (le)'
    ')'
)

BACKEND_UPTIME_SECONDS_QUERY = (
    'time() - '
    'process_start_time_seconds{job="backend"}'
)


class PrometheusQueryError(RuntimeError):
    pass


def _query_scalar(query: str) -> float | None:
    base = settings.prometheus_url.rstrip("/")
    url = (
        f"{base}/api/v1/query?"
        + urllib.parse.urlencode({"query": query})
    )

    try:
        with urllib.request.urlopen(
            url,
            timeout=5,
        ) as response:
            payload = json.load(response)
    except Exception as exc:
        raise PrometheusQueryError(
            f"No se pudo consultar Prometheus: {exc}"
        ) from exc

    if payload.get("status") != "success":
        raise PrometheusQueryError(
            "Prometheus devolvió una respuesta no válida"
        )

    results = payload.get("data", {}).get("result", [])

    if not results:
        return None

    raw_value = results[0].get("value", [None, None])[1]

    if raw_value is None:
        return None

    try:
        value = float(raw_value)
    except (TypeError, ValueError) as exc:
        raise PrometheusQueryError(
            "Prometheus devolvió un valor no numérico"
        ) from exc

    if not math.isfinite(value):
        return None

    return value


def get_observability_summary() -> dict:
    requests_per_second = (
        _query_scalar(REQUESTS_PER_SECOND_QUERY)
        or 0.0
    )

    error_rate_percent = (
        _query_scalar(ERROR_RATE_PERCENT_QUERY)
        or 0.0
    )

    latency_seconds = (
        _query_scalar(LATENCY_P95_SECONDS_QUERY)
        or 0.0
    )

    backend_uptime_seconds = (
        _query_scalar(BACKEND_UPTIME_SECONDS_QUERY)
        or 0.0
    )

    latency_p95_ms = latency_seconds * 1000

    if (
        error_rate_percent >= 5
        or latency_p95_ms >= 1000
    ):
        status = "degraded"
    else:
        status = "healthy"

    return {
        "status": status,
        "prometheus_status": "up",
        "requests_per_second": round(
            requests_per_second,
            3,
        ),
        "error_rate_percent": round(
            error_rate_percent,
            2,
        ),
        "latency_p95_ms": round(
            latency_p95_ms,
            1,
        ),
        "backend_uptime_seconds": round(
            backend_uptime_seconds,
            1,
        ),
        "evaluated_at": datetime.now(
            timezone.utc
        ),
    }


OBSERVABILITY_RANGE_SECONDS = 3600
OBSERVABILITY_STEP_SECONDS = 60


def _query_range(
    query: str,
    start: int,
    end: int,
    step: int,
) -> list[dict]:
    base = settings.prometheus_url.rstrip("/")

    url = (
        f"{base}/api/v1/query_range?"
        + urllib.parse.urlencode(
            {
                "query": query,
                "start": start,
                "end": end,
                "step": step,
            }
        )
    )

    try:
        with urllib.request.urlopen(
            url,
            timeout=5,
        ) as response:
            payload = json.load(response)
    except Exception as exc:
        raise PrometheusQueryError(
            f"No se pudo consultar Prometheus: {exc}"
        ) from exc

    if payload.get("status") != "success":
        raise PrometheusQueryError(
            "Prometheus devolvió una respuesta no válida"
        )

    results = payload.get("data", {}).get("result", [])

    if not results:
        return []

    points = []

    for timestamp, raw_value in results[0].get(
        "values",
        [],
    ):
        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            continue

        if not math.isfinite(value):
            continue

        points.append(
            {
                "timestamp": int(timestamp),
                "value": value,
            }
        )

    return points


def get_observability_timeseries() -> dict:
    end = int(
        datetime.now(timezone.utc).timestamp()
    )
    start = end - OBSERVABILITY_RANGE_SECONDS

    requests = _query_range(
        REQUESTS_PER_SECOND_QUERY,
        start,
        end,
        OBSERVABILITY_STEP_SECONDS,
    )

    latency = _query_range(
        LATENCY_P95_SECONDS_QUERY,
        start,
        end,
        OBSERVABILITY_STEP_SECONDS,
    )

    requests_per_second = [
        {
            "timestamp": point["timestamp"],
            "value": round(
                point["value"],
                3,
            ),
        }
        for point in requests
    ]

    latency_p95_ms = [
        {
            "timestamp": point["timestamp"],
            "value": round(
                point["value"] * 1000,
                1,
            ),
        }
        for point in latency
    ]

    return {
        "range_seconds": OBSERVABILITY_RANGE_SECONDS,
        "step_seconds": OBSERVABILITY_STEP_SECONDS,
        "requests_per_second": requests_per_second,
        "latency_p95_ms": latency_p95_ms,
    }
