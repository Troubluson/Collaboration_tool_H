from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum


class IWebSocketMessage(BaseModel):
    event: str
    data: dict


class CreateFileRequest(BaseModel):
    name: str


class Operation(BaseModel):
    userId: str
    type: str
    index: int
    text: str

class OperationEvent(BaseModel):
    userId: str
    type: str
    index: int
    text: str
    revision: int
    def to_op(self) -> Operation:
        return Operation.model_construct(self)

class CollaborativeDocument(BaseModel):
    id: Optional[str] = None
    channelId: str
    name: str
    content: str
    operations: List[Operation]



