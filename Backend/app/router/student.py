from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.user import User
from app.schemas.student import StudentCreate, StudentOut, StudentPasswordUpdate

router = APIRouter(prefix="/students", tags=["Students"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_admin(x_role: str = Header(default="admin")):
    if x_role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return True

@router.get("/", response_model=List[StudentOut])
def get_all_students(db: Session = Depends(get_db), is_admin: bool = Depends(verify_admin)):
    return db.query(User).filter(User.role == "student").all()

@router.post("/", response_model=StudentOut)
def create_single_student(data: StudentCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(**data.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/bulk", response_model=List[StudentOut])
def create_bulk_students(data: List[StudentCreate], db: Session = Depends(get_db)):
    new_users = []
    for d in data:
        db_user = db.query(User).filter(User.email == d.email).first()
        if not db_user:
            new_user = User(**d.model_dump())
            db.add(new_user)
            new_users.append(new_user)
    db.commit()
    for user in new_users:
        db.refresh(user)
    return new_users

@router.patch("/{user_id}/password")
def update_student_password(user_id: str, data: StudentPasswordUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.user_id == user_id, User.role == "student").first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_user.password = data.password
    db.commit()
    return {"message": "Password updated successfully"}

@router.delete("/{user_id}")
def delete_student(user_id: str, db: Session = Depends(get_db), is_admin: bool = Depends(verify_admin)):
    db_user = db.query(User).filter(User.user_id == user_id, User.role == "student").first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "Student deleted"}
