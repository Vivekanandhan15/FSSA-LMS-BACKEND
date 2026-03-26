from pydantic import BaseModel
from typing import Optional

class SubTopicCreate(BaseModel):
    sub_topic_id: str
    main_topic_id: str
    title: str
    isHidden: bool = False

class SubTopicUpdate(BaseModel):
    title: Optional[str] = None
    isHidden: Optional[bool] = None

class SubTopicOut(SubTopicCreate):
    class Config:
        from_attributes = True
