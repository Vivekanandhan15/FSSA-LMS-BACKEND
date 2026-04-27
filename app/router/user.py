from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db 
from app.schemas.user import UserCreate, UserOut, UserLogin, ChangePasswordRequest, ResetPasswordRequest
from app.services.user import create_user, get_users, get_user, update_user, delete_user, get_user_by_email

router = APIRouter(prefix="/users", tags=["Users"])

# ─── AUTHENTICATION ROUTE ──────────────────────────────────────────

@router.post("/login")
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # 1. Find the user by email
    user = get_user_by_email(db, email=user_credentials.email)
    
    # 2. Check if user exists and password matches
    if not user or user.password != user_credentials.password:
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password"
        )
        
    # 3. Return the user info back to React!
    return {
        "message": "Login successful",
        "role": user.role,
        "name": user.name,
        "is_first_login": user.is_first_login
    }

@router.post("/change-password")
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password = data.new_password
    user.name = data.name
    user.is_first_login = False
    
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password = "student123"
    user.is_first_login = True
    
    db.commit()
    return {"message": "Password reset to default (student123)"}

# ─── STANDARD CRUD ROUTES ──────────────────────────────────────────

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