from pydantic import BaseModel


# ✅ Create / Input
class StudentCreate(BaseModel):
    full_name: str
    email: str
    batch: str
    section: str
    status: str

class StudentUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    batch: str | None = None
    section: str | None = None
    status: str | None = None

class StudentResponse(StudentCreate):
    id: int
    class Config:
        from_attributes = True