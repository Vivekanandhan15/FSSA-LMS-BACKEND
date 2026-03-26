from sqlalchemy.orm import Session
from app.models.course import Course

def create_course(db: Session, data):
    obj = Course(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_courses(db: Session):
    return db.query(Course).all()

def get_course(db: Session, course_id: str):
    return db.query(Course).filter(Course.course_id == course_id).first()

def update_course(db: Session, course_id: str, data):
    obj = get_course(db, course_id)
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_course(db: Session, course_id: str):
    obj = get_course(db, course_id)
    db.delete(obj)
    db.commit()
