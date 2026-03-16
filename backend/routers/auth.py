import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models, database

# Configuration
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

print(f"--- Debug Auth Config ---")
print(f"Env Path: {env_path}")
print(f"Google Client ID: {GOOGLE_CLIENT_ID}")
print(f"Secret Key loaded: {'Yes' if os.getenv('SECRET_KEY') else 'No'}")
print(f"-------------------------")

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class GoogleToken(BaseModel):
    token: str


class UserBase(BaseModel):
    email: str
    name: str
    picture: str
    role: str = "student"


class UserResponse(UserBase):
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/google", response_model=LoginResponse)
async def google_login(token_data: GoogleToken, db: Session = Depends(get_db)):
    import traceback
    try:
        print(f"Login attempt received. Token length: {len(token_data.token)}")
        print(f"Using Client ID: {GOOGLE_CLIENT_ID}")
        
        # Verify Google Token
        idinfo = id_token.verify_oauth2_token(
            token_data.token, requests.Request(), GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        print(f"Token verified for {email}. Checking database...")
        
        # Check if user exists, if not create
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email, name=name, picture=picture, role="student"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        return LoginResponse(
            access_token=access_token, token_type="bearer", user=user
        )

    except Exception as e:
        print("CRITICAL ERROR IN GOOGLE_LOGIN:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
