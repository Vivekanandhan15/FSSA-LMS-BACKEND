from fastapi import FastAPI

app=FastAPI()

from app.router.user import router as user_router

app.include_router(user_router)
