import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.course import Course
from app.models.main_topic import MainTopic
from app.models.sub_topic import SubTopic
from app.models.content import Content
from app.schemas.course import CourseCreate, CourseUpdate, CourseOut, SectionSchema

router = APIRouter(prefix="/courses", tags=["Courses"])


# ─── 1. GET ALL COURSES ───────────────────────────────────────────────────────
@router.get("/", response_model=List[CourseOut])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


# ─── 2. CREATE A COURSE ───────────────────────────────────────────────────────
@router.post("/", response_model=CourseOut)
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    if not data.course_id:
        data.course_id = str(uuid.uuid4())

    db_obj = Course(
        course_id=data.course_id,
        course_title=data.course_title,
        course_description=data.course_description,
        isHidden=data.isHidden,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ─── 3. GET SINGLE COURSE ─────────────────────────────────────────────────────
@router.get("/{course_id}", response_model=CourseOut)
def get_course_by_id(course_id: str, db: Session = Depends(get_db)):
    db_obj = db.query(Course).filter(Course.course_id == course_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Course not found")
    return db_obj


# ─── 4. GET COURSE SECTIONS (full tree: sections → topics → blocks) ───────────
@router.get("/{course_id}/sections")
def get_course_sections(course_id: str, db: Session = Depends(get_db)):
    main_topics = (
        db.query(MainTopic)
        .filter(MainTopic.course_id == course_id)
        .order_by(MainTopic.created_at)
        .all()
    )

    sections = []
    for main_topic in main_topics:
        sub_topics = (
            db.query(SubTopic)
            .filter(SubTopic.main_topic_id == main_topic.main_topic_id)
            .order_by(SubTopic.created_at)
            .all()
        )

        topics = []
        for sub_topic in sub_topics:
            contents = (
                db.query(Content)
                .filter(Content.sub_topic_id == sub_topic.sub_topic_id)
                .order_by(Content.created_at)
                .all()
            )

            blocks = []
            for content in contents:
                # Try to parse value as JSON (for complex blocks like image/link)
                try:
                    value = json.loads(content.title)
                except (json.JSONDecodeError, TypeError):
                    value = content.title

                blocks.append(
                    {
                        "id": content.content_id,
                        "type": content.content_type,
                        "value": value,
                    }
                )

            topics.append(
                {
                    "id": sub_topic.sub_topic_id,
                    "title": sub_topic.title,
                    "visible": not sub_topic.isHidden,
                    "blocks": blocks,
                }
            )

        sections.append(
            {
                "id": main_topic.main_topic_id,
                "title": main_topic.title,
                "visible": not main_topic.isHidden,
                "topics": topics,
            }
        )

    return sections


# ─── 5. UPDATE COURSE DETAILS ─────────────────────────────────────────────────
@router.put("/{course_id}", response_model=CourseOut)
def update_course(course_id: str, data: CourseUpdate, db: Session = Depends(get_db)):
    db_obj = db.query(Course).filter(Course.course_id == course_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.commit()
    db.refresh(db_obj)
    return db_obj


# ─── 6. SAVE COURSE SECTIONS (full tree replace) ──────────────────────────────
@router.put("/{course_id}/sections")
def update_course_sections(
    course_id: str,
    sections_data: List[SectionSchema],
    db: Session = Depends(get_db),
):
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # --- Delete all existing nested data for this course ---
    main_topics = (
        db.query(MainTopic).filter(MainTopic.course_id == course_id).all()
    )
    for mt in main_topics:
        sub_topics = (
            db.query(SubTopic)
            .filter(SubTopic.main_topic_id == mt.main_topic_id)
            .all()
        )
        for st in sub_topics:
            db.query(Content).filter(
                Content.sub_topic_id == st.sub_topic_id
            ).delete(synchronize_session=False)
        db.query(SubTopic).filter(
            SubTopic.main_topic_id == mt.main_topic_id
        ).delete(synchronize_session=False)
    db.query(MainTopic).filter(
        MainTopic.course_id == course_id
    ).delete(synchronize_session=False)
    db.flush()

    # --- Insert new structure ---
    for section_data in sections_data:
        main_topic = MainTopic(
            main_topic_id=section_data.id
            if not section_data.id.startswith("tmp_")
            else str(uuid.uuid4()),
            course_id=course_id,
            title=section_data.title,
            isHidden=not section_data.visible,
        )
        db.add(main_topic)
        db.flush()  # Get main_topic_id persisted

        for topic_data in section_data.topics:
            sub_topic = SubTopic(
                sub_topic_id=topic_data.id
                if not topic_data.id.startswith("tmp_")
                else str(uuid.uuid4()),
                main_topic_id=main_topic.main_topic_id,
                title=topic_data.title,
                isHidden=not topic_data.visible,
            )
            db.add(sub_topic)
            db.flush()

            for block_data in topic_data.blocks:
                # Serialize complex values (dicts) to JSON string
                if isinstance(block_data.value, dict):
                    serialized_value = json.dumps(block_data.value)
                else:
                    serialized_value = str(block_data.value) if block_data.value is not None else ""

                content = Content(
                    content_id=block_data.id
                    if not block_data.id.startswith("tmp_")
                    else str(uuid.uuid4()),
                    sub_topic_id=sub_topic.sub_topic_id,
                    content_type=block_data.type,
                    title=serialized_value,
                    isHidden=False,
                )
                db.add(content)

    db.commit()
    return {"message": "Sections saved successfully ✅"}


# ─── 7. DELETE COURSE (cascade) ───────────────────────────────────────────────
@router.delete("/{course_id}")
def delete_course(course_id: str, db: Session = Depends(get_db)):
    db_obj = db.query(Course).filter(Course.course_id == course_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Course not found")

    # Cascade delete all related data
    main_topics = (
        db.query(MainTopic).filter(MainTopic.course_id == course_id).all()
    )
    for mt in main_topics:
        sub_topics = (
            db.query(SubTopic)
            .filter(SubTopic.main_topic_id == mt.main_topic_id)
            .all()
        )
        for st in sub_topics:
            db.query(Content).filter(
                Content.sub_topic_id == st.sub_topic_id
            ).delete(synchronize_session=False)
        db.query(SubTopic).filter(
            SubTopic.main_topic_id == mt.main_topic_id
        ).delete(synchronize_session=False)
    db.query(MainTopic).filter(
        MainTopic.course_id == course_id
    ).delete(synchronize_session=False)

    db.delete(db_obj)
    db.commit()
    return {"message": "Course deleted successfully ✅"}