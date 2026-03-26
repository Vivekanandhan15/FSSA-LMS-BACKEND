from datetime import datetime

from sqlalchemy import Column, DateTime, String
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    role = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
