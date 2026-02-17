from datetime import date
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..core.config import UPLOAD_DIR
from ..db import get_db
from ..deps import get_current_user
from ..models import Task, TaskAttachment, User
from ..schemas import MessageOut, TaskCreate, TaskOut, TaskUpdate
from ..services.tasks import (
    delete_file_if_exists,
    get_user_task_or_404,
    normalize_tags,
    task_to_out,
    validate_dates,
)

router = APIRouter(tags=["tasks"])


@router.get("/tasks", response_model=list[TaskOut])
def get_tasks(
    q: str | None = None,
    status_filter: Literal["all", "active", "done"] = "all",
    priority: Literal["all", "low", "medium", "high"] = "all",
    tag: str | None = None,
    due_from: date | None = None,
    due_to: date | None = None,
    sort: Literal["created_desc", "created_asc", "due_asc", "due_desc"] = "created_desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Task)
        .options(joinedload(Task.attachments))
        .where(Task.user_id == current_user.id)
    )

    if q:
        pattern = f"%{q.strip()}%"
        query = query.where((Task.title.ilike(pattern)) | (Task.notes.ilike(pattern)))

    if status_filter == "active":
        query = query.where(Task.done.is_(False))
    elif status_filter == "done":
        query = query.where(Task.done.is_(True))

    if priority != "all":
        query = query.where(Task.priority == priority)

    if tag:
        query = query.where(Task.tags.ilike(f"%{tag.strip().lower()}%"))

    if due_from:
        query = query.where(Task.end_date >= due_from)
    if due_to:
        query = query.where(Task.end_date <= due_to)

    if sort == "created_asc":
        query = query.order_by(Task.id.asc())
    elif sort == "due_asc":
        query = query.order_by(Task.end_date.asc(), Task.id.asc())
    elif sort == "due_desc":
        query = query.order_by(Task.end_date.desc(), Task.id.desc())
    else:
        query = query.order_by(Task.id.desc())

    tasks = db.scalars(query).unique().all()
    return [task_to_out(task) for task in tasks]


@router.post("/tasks", response_model=TaskOut)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_dates(payload.start_date, payload.end_date)

    task = Task(
        title=payload.title.strip(),
        done=False,
        start_date=payload.start_date,
        end_date=payload.end_date,
        priority=payload.priority,
        tags=normalize_tags(payload.tags),
        notes=payload.notes.strip(),
        recurring=payload.recurring,
        user_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    db.refresh(task, attribute_names=["attachments"])
    return task_to_out(task)


@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_user_task_or_404(db, current_user.id, task_id)

    next_start = payload.start_date if payload.start_date is not None else task.start_date
    next_end = payload.end_date if payload.end_date is not None else task.end_date
    validate_dates(next_start, next_end)

    if payload.title is not None:
        task.title = payload.title.strip()
    if payload.done is not None:
        task.done = payload.done
    if payload.start_date is not None:
        task.start_date = payload.start_date
    if payload.end_date is not None:
        task.end_date = payload.end_date
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.tags is not None:
        task.tags = normalize_tags(payload.tags)
    if payload.notes is not None:
        task.notes = payload.notes.strip()
    if payload.recurring is not None:
        task.recurring = payload.recurring

    db.commit()
    db.refresh(task)
    db.refresh(task, attribute_names=["attachments"])
    return task_to_out(task)


@router.delete("/tasks/{task_id}", response_model=MessageOut)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_user_task_or_404(db, current_user.id, task_id)

    for attachment in task.attachments:
        delete_file_if_exists(attachment.file_path)

    db.delete(task)
    db.commit()
    return {"message": "Görev silindi"}


@router.post("/tasks/{task_id}/attachments", response_model=TaskOut)
def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_user_task_or_404(db, current_user.id, task_id)

    safe_name = Path(file.filename or "file").name
    unique_name = f"{uuid4().hex}_{safe_name}"
    target_path = UPLOAD_DIR / unique_name

    raw = file.file.read()
    target_path.write_bytes(raw)

    attachment = TaskAttachment(
        task_id=task.id,
        file_name=safe_name,
        file_path=str(target_path),
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(raw),
    )
    db.add(attachment)
    db.commit()
    db.refresh(task)
    db.refresh(task, attribute_names=["attachments"])
    return task_to_out(task)


@router.get("/attachments/{attachment_id}")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(TaskAttachment)
        .join(Task)
        .where(TaskAttachment.id == attachment_id, Task.user_id == current_user.id)
    )
    attachment = db.scalar(query)
    if attachment is None:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    file_path = Path(attachment.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    return FileResponse(
        path=file_path,
        media_type=attachment.content_type,
        filename=attachment.file_name,
    )


@router.delete("/attachments/{attachment_id}", response_model=TaskOut)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(TaskAttachment)
        .options(joinedload(TaskAttachment.task).joinedload(Task.attachments))
        .join(Task)
        .where(TaskAttachment.id == attachment_id, Task.user_id == current_user.id)
    )
    attachment = db.scalar(query)
    if attachment is None:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

    task = attachment.task
    delete_file_if_exists(attachment.file_path)

    db.delete(attachment)
    db.commit()
    db.refresh(task)
    db.refresh(task, attribute_names=["attachments"])
    return task_to_out(task)

