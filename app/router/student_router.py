from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from typing import List
import uuid
import io

from app.db.database import get_db
from app.models.student_model import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate

router = APIRouter(prefix="/students", tags=["Students"])


# ✅ CREATE SINGLE
@router.post("/", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_student = Student(**student.dict())
    db.add(new_student)
    
    # Also create a User record so they can login
    new_user = User(
        user_id=str(uuid.uuid4()),
        name=student.full_name,
        email=student.email,
        password="student123",
        role="student",
        is_first_login=True
    )
    db.add(new_user)
    
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
    print(f"DEBUG: Received upload request. Filename: {file.filename}, Batch: {batch}")
    try:
        contents = await file.read()
        print(f"DEBUG: File read. Size: {len(contents)} bytes")
        
        df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
        print(f"DEBUG: Excel parsed. Rows: {len(df)}")

        required_columns = ["full_name", "email", "section", "status"]
        for col in required_columns:
            if col not in df.columns:
                print(f"DEBUG: Missing column: {col}")
                raise HTTPException(status_code=400, detail=f"Missing column in Excel: {col}")

        for _, row in df.iterrows():
            email = str(row["email"]).strip()
            print(f"DEBUG: Processing student: {email}")
            existing = db.query(Student).filter(Student.email == email).first()
            if existing:
                print(f"DEBUG: Student already exists: {email}")
                continue

            student = Student(
                full_name=row["full_name"],
                email=email,
                batch=batch,
                section=row["section"],
                status=row["status"]
            )
            db.add(student)

            new_user = User(
                user_id=str(uuid.uuid4()),
                name=row["full_name"],
                email=email,
                password="student123",
                role="student",
                is_first_login=True
            )
            db.add(new_user)

        db.commit()
        print("DEBUG: Commit successful")
        return {"message": "Students uploaded successfully 🚀"}
    except Exception as e:
        print(f"DEBUG: ERROR during upload: {str(e)}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# ✅ GET ALL (with Pagination)
@router.get("/")
def get_students(skip: int = 0, limit: int = 8, db: Session = Depends(get_db)):
    total = db.query(Student).count()
    students = db.query(Student).offset(skip).limit(limit).all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "students": students
    }


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