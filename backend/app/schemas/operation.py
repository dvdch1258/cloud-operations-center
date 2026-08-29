from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class OperationExecutionResponse(BaseModel):
    id: int
    operation: str
    status: str
    requested_by_user_id: int | None
    requested_by_username: str
    started_at: datetime
    finished_at: datetime | None
    duration_ms: float | None
    result: dict[str, Any] | None
    error: str | None

    model_config = ConfigDict(
        from_attributes=True
    )
