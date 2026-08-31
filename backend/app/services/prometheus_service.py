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

LATENCY_P50_SECONDS_QUERY = (
    'histogram_quantile('
    '0.50, '
    'sum(rate('
    'http_request_duration_highr_seconds_bucket'
    '{job="backend"}[5m]'
    ')) by (le)'
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

LATENCY_P99_SECONDS_QUERY = (
    'histogram_quantile('
    '0.99, '
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

    latency_p50_seconds = (
        _query_scalar(LATENCY_P50_SECONDS_QUERY)
        or 0.0
    )

    latency_p95_seconds = (
        _query_scalar(LATENCY_P95_SECONDS_QUERY)
        or 0.0
    )

    latency_p99_seconds = (
        _query_scalar(LATENCY_P99_SECONDS_QUERY)
        or 0.0
    )

    backend_uptime_seconds = (
        _query_scalar(BACKEND_UPTIME_SECONDS_QUERY)
        or 0.0
    )

    latency_p50_ms = latency_p50_seconds * 1000
    latency_p95_ms = latency_p95_seconds * 1000
    latency_p99_ms = latency_p99_seconds * 1000

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
        "latency_p50_ms": round(
            latency_p50_ms,
            1,
        ),
        "latency_p95_ms": round(
            latency_p95_ms,
            1,
        ),
        "latency_p99_ms": round(
            latency_p99_ms,
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


def _timeseries_step_seconds(
    hours: int,
) -> int:
    if hours <= 2:
        return 60

    if hours <= 6:
        return 120

    if hours <= 24:
        return 300

    if hours <= 72:
        return 900

    return 1800


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


def get_observability_timeseries(
    hours: int = 1,
) -> dict:
    range_seconds = hours * 3600
    step_seconds = _timeseries_step_seconds(
        hours
    )

    end = int(
        datetime.now(timezone.utc).timestamp()
    )
    start = end - range_seconds

    requests = _query_range(
        REQUESTS_PER_SECOND_QUERY,
        start,
        end,
        step_seconds,
    )

    error_rate = _query_range(
        ERROR_RATE_PERCENT_QUERY,
        start,
        end,
        step_seconds,
    )

    latency_p50 = _query_range(
        LATENCY_P50_SECONDS_QUERY,
        start,
        end,
        step_seconds,
    )

    latency_p95 = _query_range(
        LATENCY_P95_SECONDS_QUERY,
        start,
        end,
        step_seconds,
    )

    latency_p99 = _query_range(
        LATENCY_P99_SECONDS_QUERY,
        start,
        end,
        step_seconds,
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

    error_rate_percent = [
        {
            "timestamp": point["timestamp"],
            "value": round(
                point["value"],
                2,
            ),
        }
        for point in error_rate
    ]

    def latency_to_ms(points):
        return [
            {
                "timestamp": point["timestamp"],
                "value": round(
                    point["value"] * 1000,
                    1,
                ),
            }
            for point in points
        ]

    return {
        "range_seconds": range_seconds,
        "step_seconds": step_seconds,
        "requests_per_second":
            requests_per_second,
        "error_rate_percent":
            error_rate_percent,
        "latency_p50_ms":
            latency_to_ms(latency_p50),
        "latency_p95_ms":
            latency_to_ms(latency_p95),
        "latency_p99_ms":
            latency_to_ms(latency_p99),
    }
