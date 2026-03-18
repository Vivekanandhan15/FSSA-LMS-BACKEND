import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

def promote_user(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found. Please log in once first to create the account.")
            return
        
        user.role = "admin"
        db.commit()
        print(f"Success! User '{email}' has been promoted to Admin.")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
    else:
        promote_user(sys.argv[1])
