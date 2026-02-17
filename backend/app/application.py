from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .core.config import UPLOAD_DIR
from .db import engine
from .models import Base
from .routers import auth, notifications, profile, tasks
from .schemas import MessageOut


def create_app() -> FastAPI:
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def startup() -> None:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(bind=engine)

        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)"))
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(16) DEFAULT 'medium'"))
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT ''"))
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes VARCHAR(2000) DEFAULT ''"))
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring VARCHAR(16) DEFAULT 'none'"))

    @app.get("/", response_model=MessageOut)
    def root() -> MessageOut:
        return {"message": "Backend çalışıyor"}

    app.include_router(auth.router)
    app.include_router(profile.router)
    app.include_router(notifications.router)
    app.include_router(tasks.router)

    return app

