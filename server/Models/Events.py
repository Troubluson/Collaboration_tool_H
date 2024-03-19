
from typing import Optional
from pydantic import BaseModel

from Models.Entities import IOperation

class ChangeData(BaseModel):
    revision: int
    operation: IOperation 

class ChangeEvent(BaseModel):
    event: Optional[str] = "change"
    data: ChangeData

class SyncData(BaseModel):
    revision: int
    content: str 

class SyncEvent(BaseModel):
    event: Optional[str] = "document"
    data: SyncData

class ErrorData(BaseModel):
    reason: str
class ErrorEvent(BaseModel):
    event: Optional[str] = "error"
    data: ErrorData

class OperationEvent(BaseModel):
    userId: str
    type: str
    index: int
    text: str
    revision: int
    def to_op(self) -> IOperation:
        return IOperation.model_construct(self)





