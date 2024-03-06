from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum

class CreateFileRequest(BaseModel):
    name: str
    
class EditType(Enum):
    ADD = 0
    DELETE = 1

class DocumentEdit(BaseModel):
    id: Optional[str] = None,
    userId: str
    type: EditType
    timeStamp: datetime
    startIndex: int
    content: str

class CollaborativeDocument(BaseModel):
    id: Optional[str] = None
    channelId: str
    name: str
    paragraphs: List[str]
    lockedParagraphs: List[int]
    edits: List[DocumentEdit]



