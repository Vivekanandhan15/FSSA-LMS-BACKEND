from app.db.session import engine
from app.db.base import Base

from app.models.user import User
from app.models.role import Role
from app.models.user_role import user_roles

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
