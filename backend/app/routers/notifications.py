from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Task, User
from ..schemas import NotificationOut

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=list[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    soon_limit = today + timedelta(days=2)
    tasks = db.scalars(
        select(Task).where(Task.user_id == current_user.id, Task.done.is_(False)).order_by(Task.end_date)
    ).all()

    notifications: list[NotificationOut] = []
    for task in tasks:
        if task.end_date < today:
            notifications.append(
                NotificationOut(
                    task_id=task.id,
                    title=task.title,
                    due_date=task.end_date,
                    level="overdue",
                    message="Görev gecikti",
                )
            )
        elif task.end_date <= soon_limit:
            notifications.append(
                NotificationOut(
                    task_id=task.id,
                    title=task.title,
                    due_date=task.end_date,
                    level="soon",
                    message="Görev süresi yaklaşıyor",
                )
            )

    return notifications

