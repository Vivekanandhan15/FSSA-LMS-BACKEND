from pydantic import BaseModel
from typing import Optional

class ContentCreate(BaseModel):
    content_id: str
    sub_topic_id: str
    content_type: str
    title: str
    isHidden: bool = False

class ContentUpdate(BaseModel):
    content_type: Optional[str] = None
    title: Optional[str] = None
    isHidden: Optional[bool] = None

class ContentOut(ContentCreate):
    class Config:
        from_attributes = True
