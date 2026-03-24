from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.schemas.auth import LoginData
from app.models.user import User   # your model
from app.utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):

    # get user from DB
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # check password (simple version)
    if user.password != data.password:
        raise HTTPException(status_code=400, detail="Wrong password")

    # create token
    token = create_access_token({
        "sub": user.email,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }