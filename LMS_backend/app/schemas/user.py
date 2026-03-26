from pydantic import BaseModel

class UserCreate(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    password: str

class UserOut(UserCreate):
    model_config = {
        "from_attributes": True
    }
