

from pydantic import BaseModel


class CreateChannelRequest(BaseModel):
    userId: str
    name: str


class CreateFileRequest(BaseModel):
    name: str

class LatencyRequest(BaseModel):
    latency: float


