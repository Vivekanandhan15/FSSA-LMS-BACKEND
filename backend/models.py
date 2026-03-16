from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True, index=True)
    full = Column(String)
    start = Column(String)
    end = Column(String)
    summary = Column(String)
    hidden = Column(Boolean, default=False)
    batches = Column(JSONB, default=list)
    content = Column(
        JSONB, default=list
    )  # [{title: '...', articles: [{id: '...', title: '...', html: '...'}]}]


class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    name = Column(String)
    picture = Column(String)
    role = Column(String, default="student")
