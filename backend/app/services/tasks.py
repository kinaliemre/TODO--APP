from datetime import date
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..models import Task
from ..schemas import AttachmentOut, TaskOut


def validate_dates(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Başlangıç tarihi bitiş tarihinden sonra olamaz")


def normalize_tags(tags: list[str]) -> str:
    cleaned = []
    seen: set[str] = set()
    for tag in tags:
        normalized = tag.strip().lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        cleaned.append(normalized)
    return ",".join(cleaned)


def split_tags(tags_csv: str) -> list[str]:
    if not tags_csv:
        return []
    return [item for item in tags_csv.split(",") if item]


def task_to_out(task: Task) -> TaskOut:
    return TaskOut(
        id=task.id,
        title=task.title,
        done=task.done,
        start_date=task.start_date,
        end_date=task.end_date,
        priority=task.priority,
        tags=split_tags(task.tags),
        notes=task.notes,
        recurring=task.recurring,
        attachments=[
            AttachmentOut(
                id=item.id,
                file_name=item.file_name,
                content_type=item.content_type,
                size_bytes=item.size_bytes,
                created_at=item.created_at,
            )
            for item in task.attachments
        ],
    )


def get_user_task_or_404(db: Session, user_id: int, task_id: int) -> Task:
    query = (
        select(Task)
        .options(joinedload(Task.attachments))
        .where(Task.id == task_id, Task.user_id == user_id)
    )
    task = db.scalar(query)
    if task is None:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    return task


def delete_file_if_exists(file_path: str) -> None:
    path = Path(file_path)
    if path.exists():
        path.unlink(missing_ok=True)

