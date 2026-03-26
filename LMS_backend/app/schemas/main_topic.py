from pydantic import BaseModel
from typing import Optional

class MainTopicCreate(BaseModel):
    main_topic_id: str
    course_id: str
    title: str
    isHidden: bool = False

class MainTopicUpdate(BaseModel):
    title: Optional[str] = None
    isHidden: Optional[bool] = None

class MainTopicOut(MainTopicCreate):
    class Config:
        from_attributes = True
