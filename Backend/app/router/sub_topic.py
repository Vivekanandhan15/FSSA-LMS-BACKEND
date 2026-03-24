from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.sub_topic import SubTopic
from app.models.content import Content
from app.schemas.sub_topic import SubTopicCreate, SubTopicUpdate, SubTopicOut

router = APIRouter(prefix="/sub-topics", tags=["Sub Topics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[SubTopicOut])
def get_sub_topics(db: Session = Depends(get_db)):
    return db.query(SubTopic).all()

@router.post("/", response_model=SubTopicOut)
def create_sub_topic(data: SubTopicCreate, db: Session = Depends(get_db)):
    db_obj = SubTopic(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{sub_topic_id}", response_model=SubTopicOut)
def update_sub_topic(sub_topic_id: str, data: SubTopicUpdate, db: Session = Depends(get_db)):
    db_obj = db.query(SubTopic).filter(SubTopic.sub_topic_id == sub_topic_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="SubTopic not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    
    if "isHidden" in update_data:
        is_hidden = update_data["isHidden"]
        db.query(Content).filter(Content.sub_topic_id == sub_topic_id).update({"isHidden": is_hidden}, synchronize_session=False)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{sub_topic_id}")
def delete_sub_topic(sub_topic_id: str, db: Session = Depends(get_db)):
    db_obj = db.query(SubTopic).filter(SubTopic.sub_topic_id == sub_topic_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="SubTopic not found")
    
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}
