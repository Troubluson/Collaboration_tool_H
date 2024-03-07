
from typing import Optional
from pydantic import BaseModel
from Models.CollaborativeFile import Operation

class ChangeData(BaseModel):
    revision: int
    operation: Operation 

class ChangeEvent(BaseModel):
    event: Optional[str] = "change"
    data: ChangeData

class SyncData(BaseModel):
    revision: int
    content: str 

class SyncEvent(BaseModel):
    event: Optional[str] = "document"
    data: SyncData




