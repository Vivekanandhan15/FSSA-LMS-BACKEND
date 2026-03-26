from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey
from app.db.database import Base

class Course(Base):
    __tablename__ = "courses"

    course_id = Column(String, primary_key=True)
    course_title = Column(String)
    course_description = Column(String)
    isHidden = Column(Boolean) # "true" or "false"
    created_at = Column(DateTime, default=datetime.utcnow)          
