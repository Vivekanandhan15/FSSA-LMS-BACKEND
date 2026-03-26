from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from typing import List

from app.db.database import get_db
from app.models.student_model import Student
from app.schemas.student import StudentCreate, StudentResponse

router = APIRouter(prefix="/students", tags=["Students"])


# ✅ CREATE SINGLE
@router.post("/", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_student = Student(**student.dict())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


# ✅ BULK UPLOAD (EXCEL)
@router.post("/upload")
async def upload_students(file: UploadFile = File(...), db: Session = Depends(get_db)):

    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    contents = await file.read()
    df = pd.read_excel(contents)

    required_columns = ["full_name", "email", "batch", "section", "courses_enrolled", "status"]

    for col in required_columns:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Missing column: {col}")

    for _, row in df.iterrows():
        existing = db.query(Student).filter(Student.email == row["email"]).first()
        if existing:
            continue

        student = Student(
            full_name=row["full_name"],
            email=row["email"],
            batch=row["batch"],
            section=row["section"],
            courses_enrolled=row["courses_enrolled"],
            status=row["status"]
        )
        db.add(student)

    db.commit()

    return {"message": "Students uploaded successfully 🚀"}


# ✅ GET ALL
@router.get("/", response_model=List[StudentResponse])
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


# ✅ GET ONE
@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


# ✅ DELETE
@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()

    return {"message": "Deleted successfully"}