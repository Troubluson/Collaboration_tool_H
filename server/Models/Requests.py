

from pydantic import BaseModel


class CreateChannelRequest(BaseModel):
    userId: str
    name: str

