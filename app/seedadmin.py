from app.db.database import SessionLocal
from app.models.user import User
from app.services.user import create_user
from app.schemas.user import UserCreate

def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists to avoid duplicates
        admin_email = "admin@fssa.com"
        exists = db.query(User).filter(User.email == admin_email).first()
        
        if exists:
            print(f"Admin with email {admin_email} already exists.")
            return

        # Define your new admin data
        admin_data = UserCreate(
            user_id="ADM001",
            name="Super Admin",
            email=admin_email,
            role="admin",
            password="adminpassword123" # In production, use hashed passwords!
        )

        # Use your existing service to add to DB
        new_admin = create_user(db, admin_data)
        print(f"Successfully seeded admin: {new_admin.name} ({new_admin.email})")

    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()