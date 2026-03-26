from pydantic import BaseModel


# ✅ Create / Input
class StudentCreate(BaseModel):
    full_name: str
    email: str
    batch: str
    section: str
    courses_enrolled: str
    status: str


# ✅ Response / Output
class StudentResponse(StudentCreate):
    id: int

    class Config:
        from_attributes = True   # for SQLAlchemy