
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
    event: Optional[str] = "sync_document"
    data: SyncData

class ErrorData(BaseModel):
    reason: str
class ErrorEvent(BaseModel):
    event: Optional[str] = "error"
    data: ErrorData

class OperationEvent(BaseModel):
    operation: IOperation
    revision: int





