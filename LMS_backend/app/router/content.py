from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db 
from app.db.database import SessionLocal
from app.models.content import Content
from app.schemas.content import ContentCreate, ContentUpdate, ContentOut

router = APIRouter(prefix="/contents", tags=["Contents"])


@router.get("/", response_model=List[ContentOut])
def get_contents(db: Session = Depends(get_db)):
    return db.query(Content).all()

@router.post("/", response_model=ContentOut)
def create_content(data: ContentCreate, db: Session = Depends(get_db)):
    db_obj = Content(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{content_id}", response_model=ContentOut)
def update_content(content_id: str, data: ContentUpdate, db: Session = Depends(get_db)):
    db_obj = db.query(Content).filter(Content.content_id == content_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Content not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{content_id}")
def delete_content(content_id: str, db: Session = Depends(get_db)):
    db_obj = db.query(Content).filter(Content.content_id == content_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Content not found")
    
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}
