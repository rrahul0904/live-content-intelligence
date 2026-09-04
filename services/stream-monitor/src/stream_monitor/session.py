from datetime import datetime, timezone
from enum import StrEnum
from pydantic import BaseModel, Field

class SessionState(StrEnum):
    STARTING = "starting"
    RUNNING = "running"
    DRAINING = "draining"
    STOPPED = "stopped"
    FAILED = "failed"

class MonitorSession(BaseModel):
    id: str
    user_channel_id: str
    external_stream_id: str
    state: SessionState = SessionState.STARTING
    lease_owner: str | None = None
    heartbeat_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def heartbeat(self, worker_id: str) -> "MonitorSession":
        self.lease_owner = worker_id
        self.heartbeat_at = datetime.now(timezone.utc)
        self.state = SessionState.RUNNING
        return self
