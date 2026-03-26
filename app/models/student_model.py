from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    batch = Column(String, nullable=False)
    section = Column(String, nullable=False)
    courses_enrolled = Column(String, nullable=False)
    status = Column(String, nullable=False)