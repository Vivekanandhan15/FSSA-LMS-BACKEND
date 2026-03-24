from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.main_topic import MainTopic
from app.models.sub_topic import SubTopic
from app.models.content import Content
from app.schemas.main_topic import MainTopicCreate, MainTopicUpdate, MainTopicOut

router = APIRouter(prefix="/main-topics", tags=["Main Topics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[MainTopicOut])
def get_main_topics(db: Session = Depends(get_db)):
    return db.query(MainTopic).all()

@router.post("/", response_model=MainTopicOut)
def create_main_topic(data: MainTopicCreate, db: Session = Depends(get_db)):
    db_obj = MainTopic(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{main_topic_id}", response_model=MainTopicOut)
def update_main_topic(main_topic_id: str, data: MainTopicUpdate, db: Session = Depends(get_db)):
    db_obj = db.query(MainTopic).filter(MainTopic.main_topic_id == main_topic_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="MainTopic not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    
    if "isHidden" in update_data:
        is_hidden = update_data["isHidden"]
        
        sub_topics = db.query(SubTopic.sub_topic_id).filter(SubTopic.main_topic_id == main_topic_id).all()
        sub_topic_ids = [st[0] for st in sub_topics]
        
        if sub_topic_ids:
            db.query(SubTopic).filter(SubTopic.sub_topic_id.in_(sub_topic_ids)).update({"isHidden": is_hidden}, synchronize_session=False)
            db.query(Content).filter(Content.sub_topic_id.in_(sub_topic_ids)).update({"isHidden": is_hidden}, synchronize_session=False)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{main_topic_id}")
def delete_main_topic(main_topic_id: str, db: Session = Depends(get_db)):
    db_obj = db.query(MainTopic).filter(MainTopic.main_topic_id == main_topic_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="MainTopic not found")
    
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}
