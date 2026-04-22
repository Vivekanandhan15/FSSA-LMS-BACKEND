from fastapi import FastAPI
from app.db.database import Base, engine

# ✅ Import routers (use your new student_router)
from app.router import (
    student_router as student,
    user,
    course,
    main_topic,
    sub_topic,
    content,
    auth
)

# ✅ Create database tables
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware

# ✅ Initialize app
app = FastAPI(title="FSSA LMS Backend")

# ✅ Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins 
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods 
    allow_headers=["*"],  # Allows all headers
)

# ✅ Include routers
app.include_router(student.router)
app.include_router(user.router)
app.include_router(course.router)
app.include_router(main_topic.router)
app.include_router(sub_topic.router)
app.include_router(content.router)
app.include_router(auth.router)

# ✅ Root API
@app.get("/")
def read_root():
    return {"message": "FSSA-LMS is working correctly 🚀"}
