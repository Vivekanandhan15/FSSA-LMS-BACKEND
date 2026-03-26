from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.database import get_db 
from app.schemas.user import UserCreate, UserOut
from app.services.user import create_user, get_users, get_user, update_user, delete_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserOut)
def add_user(data: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, data)

@router.get("/", response_model=list[UserOut])
def read_users(db: Session = Depends(get_db)):
    return get_users(db)

@router.get("/{user_id}", response_model=UserOut)
def read_user(user_id: str, db: Session = Depends(get_db)):
    return get_user(db, user_id)

@router.put("/{user_id}", response_model=UserOut)
def edit_user(user_id: str, data: UserCreate, db: Session = Depends(get_db)):
    return update_user(db, user_id, data)

@router.delete("/{user_id}")
def remove_user(user_id: str, db: Session = Depends(get_db)):
    delete_user(db, user_id)
    return {"status": "deleted"}
