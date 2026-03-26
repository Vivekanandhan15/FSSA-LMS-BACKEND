from sqlalchemy.orm import Session
from app.models.sub_topic import SubTopic

def create_sub_topic(db: Session, data):
    obj = SubTopic(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_sub_topics(db: Session):
    return db.query(SubTopic).all()

def get_sub_topic(db: Session, sub_topic_id: str):
    return db.query(SubTopic).filter(SubTopic.sub_topic_id == sub_topic_id).first()

def update_sub_topic(db: Session, sub_topic_id: str, data):
    obj = get_sub_topic(db, sub_topic_id)
    for k, v in data.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_sub_topic(db: Session, sub_topic_id: str):
    obj = get_sub_topic(db, sub_topic_id)
    db.delete(obj)
    db.commit()
