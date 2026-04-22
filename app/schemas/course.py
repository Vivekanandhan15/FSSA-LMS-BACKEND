from pydantic import BaseModel
from typing import List, Optional, Any

class CourseCreate(BaseModel):
    course_id: Optional[str] = None
    course_title: str
    course_description: str
    isHidden: bool = False

class CourseUpdate(BaseModel):
    course_title: Optional[str] = None
    course_description: Optional[str] = None
    isHidden: Optional[bool] = None

class BlockSchema(BaseModel):
    id: str
    type: str
    value: Any  # 'Any' is used because value can be a string, or a dict (for Links/Images)

# Represents a Topic, which contains a list of blocks
class TopicSchema(BaseModel):
    id: str
    title: str
    visible: bool = True
    order: Optional[int] = 0
    blocks: List[BlockSchema] = []

# Represents a Section, which contains a list of topics
class SectionSchema(BaseModel):
    id: str
    title: str
    visible: bool = True
    order: Optional[int] = 0
    topics: List[TopicSchema] = []

class CourseOut(BaseModel):
    course_id: str
    course_title: str
    course_description: str
    isHidden: bool

    class Config:
        from_attributes = True