from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Task, TaskAttachment, User
from ..schemas import MessageOut, PasswordUpdate, ProfileUpdate, UserOut
from ..security import hash_password, verify_password

router = APIRouter(tags=["profile"])


@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Kullanıcı adı boş olamaz")

    conflict = db.scalar(select(User).where(User.username == username, User.id != current_user.id))
    if conflict is not None:
        raise HTTPException(status_code=409, detail="Kullanıcı adı kullanımda")

    current_user.username = username
    db.commit()
    return UserOut(id=current_user.id, username=current_user.username)


@router.put("/profile/password", response_model=MessageOut)
def change_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Şifre güncellendi"}


@router.delete("/profile", response_model=MessageOut)
def delete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachments = db.scalars(
        select(TaskAttachment).join(Task).where(Task.user_id == current_user.id)
    ).all()

    for attachment in attachments:
        file_path = Path(attachment.file_path)
        if file_path.exists():
            file_path.unlink(missing_ok=True)

    db.delete(current_user)
    db.commit()
    return {"message": "Hesap silindi"}

