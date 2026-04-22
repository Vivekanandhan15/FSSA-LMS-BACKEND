from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from typing import List

from app.db.database import get_db
from app.models.student_model import Student
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate

router = APIRouter(prefix="/students", tags=["Students"])


# ✅ CREATE SINGLE
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
async def upload_students(
    file: UploadFile = File(...), 
    batch: str = Form(...), # <-- We now grab the batch manually from the form!
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files allowed")

    contents = await file.read()
    df = pd.read_excel(contents)

    # Removed 'batch' and 'courses_enrolled' from required columns
    required_columns = ["full_name", "email", "section", "status"]

    for col in required_columns:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Missing column in Excel: {col}")

    for _, row in df.iterrows():
        existing = db.query(Student).filter(Student.email == row["email"]).first()
        if existing:
            continue

        student = Student(
            full_name=row["full_name"],
            email=row["email"],
            batch=batch, # <-- Applied manually here
            section=row["section"],
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


# ✅ UPDATE / EDIT
@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)
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