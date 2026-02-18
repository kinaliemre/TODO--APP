from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import TokenOut, UserLogin, UserOut, UserRegister
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    username = payload.username.strip()
    normalized_username = username.lower()
    if not username:
        raise HTTPException(status_code=400, detail="Kullanıcı adı boş olamaz")

    existing = db.scalar(select(User).where(func.lower(User.username) == normalized_username))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Kullanıcı adı zaten kayıtlı")

    user = User(username=username, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()

    token = create_access_token(user.username)
    return TokenOut(access_token=token, username=user.username)


@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    normalized_username = payload.username.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.username) == normalized_username))
    if user is None:
        user_count = db.scalar(select(func.count(User.id))) or 0
        if user_count == 0:
            first_user = User(username=payload.username.strip(), password_hash=hash_password(payload.password))
            db.add(first_user)
            db.commit()
            token = create_access_token(first_user.username)
            return TokenOut(access_token=token, username=first_user.username)
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")

    token = create_access_token(user.username)
    return TokenOut(access_token=token, username=user.username)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(id=current_user.id, username=current_user.username)

