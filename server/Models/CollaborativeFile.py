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
    def apply(self, doc):
        if self.type == 'insert':
            return doc[:self.position] + self.text + doc[self.position:]
        elif self.type == 'delete':
            return doc[:self.position] + doc[self.position + len(self.text):]
        else:
            raise ValueError("Invalid operation type")

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



