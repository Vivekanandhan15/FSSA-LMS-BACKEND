from sqlalchemy.orm import Session
from app.models.user import User

def create_user(db: Session, data):
    obj = User(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_users(db: Session):
    return db.query(User).all()

def get_user(db: Session, user_id: str):
    return db.query(User).filter(User.user_id == user_id).first()

def update_user(db: Session, user_id: str, data):
    obj = get_user(db, user_id)
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_user(db: Session, user_id: str):
    obj = get_user(db, user_id)
    db.delete(obj)
    db.commit()
