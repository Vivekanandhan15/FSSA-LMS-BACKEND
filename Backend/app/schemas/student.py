from pydantic import BaseModel
from typing import List, Optional

class StudentCreate(BaseModel):
    user_id: str
    name: str
    email: str
    password: str
    role: str = "student"

class StudentPasswordUpdate(BaseModel):
    password: str

class StudentOut(BaseModel):
    user_id: str
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True
