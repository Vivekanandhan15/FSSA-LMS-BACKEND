from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Add the current directory to sys.path to allow imports of routers, models, etc.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers import auth, courses
import models
from database import engine
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FSSA LMS API")

# Allow CORS
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000", # Common for React
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)

@app.get("/")
async def root():
    return {"message": "FSSA LMS API is running", "docs": "/docs"}
