import pytest

from app.services import prometheus_service


@pytest.mark.parametrize(
    ("hours", "expected"),
    [
        (1, 60),
        (2, 60),
        (6, 120),
        (24, 300),
        (72, 900),
        (168, 1800),
    ],
)
def test_timeseries_step_seconds(
    hours,
    expected,
):
    assert (
        prometheus_service
        ._timeseries_step_seconds(hours)
        == expected
    )


def test_observability_summary_returns_quantiles(
    monkeypatch,
):
    values = {
        prometheus_service
        .REQUESTS_PER_SECOND_QUERY: 2.5,

        prometheus_service
        .ERROR_RATE_PERCENT_QUERY: 1.25,

        prometheus_service
        .LATENCY_P50_SECONDS_QUERY: 0.05,

        prometheus_service
        .LATENCY_P95_SECONDS_QUERY: 0.25,

        prometheus_service
        .LATENCY_P99_SECONDS_QUERY: 0.75,

        prometheus_service
        .BACKEND_UPTIME_SECONDS_QUERY: 3600,
    }

    monkeypatch.setattr(
        prometheus_service,
        "_query_scalar",
        lambda query: values[query],
    )

    result = (
        prometheus_service
        .get_observability_summary()
    )

    assert result["status"] == "healthy"
    assert result["prometheus_status"] == "up"

    assert (
        result["requests_per_second"]
        == 2.5
    )

    assert (
        result["error_rate_percent"]
        == 1.25
    )

    assert result["latency_p50_ms"] == 50.0
    assert result["latency_p95_ms"] == 250.0
    assert result["latency_p99_ms"] == 750.0

    assert (
        result["backend_uptime_seconds"]
        == 3600
    )


def test_observability_summary_degraded_by_p95(
    monkeypatch,
):
    values = {
        prometheus_service
        .REQUESTS_PER_SECOND_QUERY: 1.0,

        prometheus_service
        .ERROR_RATE_PERCENT_QUERY: 0.0,

        prometheus_service
        .LATENCY_P50_SECONDS_QUERY: 0.1,

        prometheus_service
        .LATENCY_P95_SECONDS_QUERY: 1.2,

        prometheus_service
        .LATENCY_P99_SECONDS_QUERY: 1.5,

        prometheus_service
        .BACKEND_UPTIME_SECONDS_QUERY: 60,
    }

    monkeypatch.setattr(
        prometheus_service,
        "_query_scalar",
        lambda query: values[query],
    )

    result = (
        prometheus_service
        .get_observability_summary()
    )

    assert result["status"] == "degraded"
    assert result["latency_p95_ms"] == 1200.0


def test_timeseries_six_hours(
    monkeypatch,
):
    calls = []

    def fake_query_range(
        query,
        start,
        end,
        step,
    ):
        calls.append(
            {
                "query": query,
                "start": start,
                "end": end,
                "step": step,
            }
        )

        value_by_query = {
            prometheus_service
            .REQUESTS_PER_SECOND_QUERY: 1.23456,

            prometheus_service
            .ERROR_RATE_PERCENT_QUERY: 2.345,

            prometheus_service
            .LATENCY_P50_SECONDS_QUERY: 0.1,

            prometheus_service
            .LATENCY_P95_SECONDS_QUERY: 0.2,

            prometheus_service
            .LATENCY_P99_SECONDS_QUERY: 0.3,
        }

        return [
            {
                "timestamp": 123456,
                "value": value_by_query[query],
            }
        ]

    monkeypatch.setattr(
        prometheus_service,
        "_query_range",
        fake_query_range,
    )

    result = (
        prometheus_service
        .get_observability_timeseries(
            hours=6
        )
    )

    assert result["range_seconds"] == 21600
    assert result["step_seconds"] == 120

    assert result["requests_per_second"] == [
        {
            "timestamp": 123456,
            "value": 1.235,
        }
    ]

    assert result["error_rate_percent"] == [
        {
            "timestamp": 123456,
            "value": 2.35,
        }
    ]

    assert result["latency_p50_ms"] == [
        {
            "timestamp": 123456,
            "value": 100.0,
        }
    ]

    assert result["latency_p95_ms"] == [
        {
            "timestamp": 123456,
            "value": 200.0,
        }
    ]

    assert result["latency_p99_ms"] == [
        {
            "timestamp": 123456,
            "value": 300.0,
        }
    ]

    assert len(calls) == 5

    for call in calls:
        assert call["step"] == 120
        assert (
            call["end"] - call["start"]
            == 21600
        )
