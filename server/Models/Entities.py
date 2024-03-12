from typing import List, Literal, Optional, Union

from pydantic import BaseModel


class IUser(BaseModel):
    id: Optional[str] = None
    username: str
    isActive: Optional[bool] = False

class IMessage(BaseModel):
    id: Optional[str] = None
    content: str
    sender: IUser
    channelId: str

class IChannelEvent(BaseModel):
    type: Literal["new_message", "user_join", "user_leave", "user_status_change"]
    content: Union[IUser, IMessage, dict]

class IChannel(BaseModel):
    id: Optional[str] = None
    name: str
    users: list[IUser] = []
    events: list[IChannelEvent] = []

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


class IWebSocketMessage(BaseModel):
    event: str
    data: dict

