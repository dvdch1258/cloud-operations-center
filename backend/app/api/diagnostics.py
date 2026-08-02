import asyncio

from fastapi import APIRouter, HTTPException, Query
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode


router = APIRouter(
    prefix="/diagnostics",
    tags=["diagnostics"],
)


@router.get("/slow")
async def controlled_slow_request(
    delay_ms: int = Query(default=1500, ge=0, le=5000),
):
    span = trace.get_current_span()
    span.set_attribute("diagnostic.scenario", "slow")
    span.set_attribute("diagnostic.delay_ms", delay_ms)

    await asyncio.sleep(delay_ms / 1000)

    return {
        "status": "ok",
        "scenario": "slow",
        "delay_ms": delay_ms,
    }


@router.get("/error")
async def controlled_error():
    message = "Controlled diagnostic error"
    exception = RuntimeError(message)

    span = trace.get_current_span()
    span.set_attribute(
        "diagnostic.scenario",
        "controlled_error",
    )
    span.record_exception(exception)
    span.set_status(
        Status(StatusCode.ERROR, message)
    )

    raise HTTPException(
        status_code=500,
        detail=message,
    )
