from sqlalchemy.orm import Session
from app.models.content import Content

def create_content(db: Session, data):
    obj = Content(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_contents(db: Session):
    return db.query(Content).all()

def get_content(db: Session, content_id: str):
    return db.query(Content).filter(Content.content_id == content_id).first()

def update_content(db: Session, content_id: str, data):
    obj = get_content(db, content_id)
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_content(db: Session, content_id: str):
    obj = get_content(db, content_id)
    db.delete(obj)
    db.commit()
