from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models, database
from routers.auth import get_current_user

router = APIRouter(prefix="/courses", tags=["courses"])


class CourseSchema(BaseModel):
    id: str
    full: str
    start: str
    end: str
    summary: str
    hidden: bool
    batches: List[str] = []
    content: List[dict] = []

    class Config:
        from_attributes = True


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Admin privileges required"
        )
    return current_user


@router.get("", response_model=List[CourseSchema])
def get_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    courses = db.query(models.Course).all()
    # Pydantic will handle serialization
    return courses


@router.get("/{course_id}", response_model=CourseSchema)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    course = (
        db.query(models.Course).filter(models.Course.id == course_id).first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("", response_model=CourseSchema)
def create_course(
    course: CourseSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    db_course = (
        db.query(models.Course).filter(models.Course.id == course.id).first()
    )
    if db_course:
        raise HTTPException(status_code=400, detail="Course ID already exists")

    new_course = models.Course(
        id=course.id,
        full=course.full,
        start=course.start,
        end=course.end,
        summary=course.summary,
        hidden=course.hidden,
        batches=course.batches,
        content=course.content,
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course


@router.put("/{course_id}", response_model=CourseSchema)
def update_course(
    course_id: str,
    course: CourseSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    db_course = (
        db.query(models.Course).filter(models.Course.id == course_id).first()
    )
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")

    db_course.full = course.full
    db_course.start = course.start
    db_course.end = course.end
    db_course.summary = course.summary
    db_course.hidden = course.hidden
    db_course.batches = course.batches
    db_course.content = course.content

    db.commit()
    db.refresh(db_course)
    return db_course


@router.delete("/{course_id}")
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    db_course = (
        db.query(models.Course).filter(models.Course.id == course_id).first()
    )
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(db_course)
    db.commit()
    return {"message": "Course deleted"}


@router.post("/{course_id}/batches")
def add_batch(
    course_id: str,
    batch_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    db_course = (
        db.query(models.Course).filter(models.Course.id == course_id).first()
    )
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")

    current_batches = list(db_course.batches)
    if batch_name not in current_batches:
        current_batches.append(batch_name)
        db_course.batches = current_batches
        db.commit()
        db.refresh(db_course)

    return db_course
