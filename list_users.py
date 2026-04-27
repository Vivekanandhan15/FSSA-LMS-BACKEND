import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base

# Add the project root to sys.path to import app
sys.path.append(os.getcwd())

from app.core.config import DATABASE_URL

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    role = Column(String)
    password = Column(String)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"ID: {user.user_id:10} | Role: {user.role:10} | Email: {user.email:30} | Password: {user.password}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
