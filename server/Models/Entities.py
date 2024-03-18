from typing import List, Literal, Optional, Union

from pydantic import BaseModel


class IUser(BaseModel):
    id: Optional[str] = None
    username: str
    latency: Optional[float] = None
    isActive: Optional[bool] = False

class IMessage(BaseModel):
    id: Optional[str] = None
    content: str
    file: Optional[str] = None
    sender: IUser
    channelId: str

class IOperation(BaseModel):
    userId: str
    type: str
    index: int
    text: str
    def apply(self, doc):
        if self.type == 'insert':
            return doc[:self.position] + self.text + doc[self.position:]
        elif self.type == 'delete':
            return doc[:self.position] + doc[self.position + len(self.text):]
        else:
            raise ValueError("Invalid operation type")
class ICollaborativeDocument(BaseModel):
    id: Optional[str] = None
    channelId: str
    name: str
    content: str
    operations: List[IOperation]

class IChannelEvent(BaseModel):
    type: Literal["new_message", "user_join", "user_leave", "user_status_change", "document_created", "document_deleted"]
    content: Union[IUser, IMessage, ICollaborativeDocument, dict]

class IChannel(BaseModel):
    id: Optional[str] = None
    name: str
    users: list[IUser] = []
    events: list[IChannelEvent] = []
    deleted: bool = False

class IChannelOperations(BaseModel):
    type: Literal["channel_sync", "channel_created", "channel_deleted"]
    content: Union[IChannel, list[IChannel]]

class IWebSocketMessage(BaseModel):
    event: str
    data: dict

class LatencyThroughputData(BaseModel):
    latency: float
    throughput: float

class IMeasurement(BaseModel):
    user_id: str
    latency: float
