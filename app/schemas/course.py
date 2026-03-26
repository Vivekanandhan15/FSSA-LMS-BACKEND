from pydantic import BaseModel
from typing import Optional

class CourseCreate(BaseModel):
    course_id: str
    course_title: str
    course_description: str
    isHidden: bool = False

class CourseUpdate(BaseModel):
    course_title: Optional[str] = None
    course_description: Optional[str] = None
    isHidden: Optional[bool] = None

class CourseOut(CourseCreate):
    class Config:
        from_attributes = True
