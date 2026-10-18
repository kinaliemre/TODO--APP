import os
import secrets
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todo_app.db")
# Set SECRET_KEY in the environment; without it a random key is used,
# so sign-ins only last until the server restarts.
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))


