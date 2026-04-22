from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserCreate(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    password: str

class UserOut(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    is_first_login: bool
    
    model_config = {
        "from_attributes": True
    }

class UserLogin(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    email: str
    name: str
    new_password: str = Field(..., min_length=8)