from sqlalchemy.orm import Session
from app.models.main_topic import MainTopic

def create_main_topic(db: Session, data):
    obj = MainTopic(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_main_topics(db: Session):
    return db.query(MainTopic).all()

def get_main_topic(db: Session, main_topic_id: str):
    return db.query(MainTopic).filter(MainTopic.main_topic_id == main_topic_id).first()

def update_main_topic(db: Session, main_topic_id: str, data):
    obj = get_main_topic(db, main_topic_id)
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_main_topic(db: Session, main_topic_id: str):
    obj = get_main_topic(db, main_topic_id)
    db.delete(obj)
    db.commit()
