import os
from datetime import date, timedelta
from typing import Generator

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Boolean, Date, Integer, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres@localhost:5432/todo_app",
)

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Backend çalışıyor"}


def _seed_tasks(db: Session) -> None:
    existing_task = db.scalar(select(Task.id).limit(1))
    if existing_task is not None:
        return

    today = date.today()
    db.add_all(
        [
            Task(
                title="İlk görev",
                done=False,
                start_date=today,
                end_date=today + timedelta(days=2),
            ),
            Task(
                title="Backend hazırla",
                done=True,
                start_date=today - timedelta(days=5),
                end_date=today - timedelta(days=1),
            ),
        ]
    )
    db.commit()


class TaskCreate(BaseModel):
    title: str
    start_date: date
    end_date: date


class TaskUpdate(BaseModel):
    title: str | None = None
    done: bool | None = None
    start_date: date | None = None
    end_date: date | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    done: bool
    start_date: date
    end_date: date

    model_config = {"from_attributes": True}


def _validate_dates(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Başlangıç tarihi bitiş tarihinden sonra olamaz")


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        _seed_tasks(db)


@app.get("/tasks", response_model=list[TaskOut])
def get_tasks(db: Session = Depends(get_db)):
    return db.scalars(select(Task).order_by(Task.id)).all()


@app.post("/tasks", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    _validate_dates(payload.start_date, payload.end_date)

    task = Task(
        title=payload.title,
        done=False,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    next_start = payload.start_date if payload.start_date is not None else task.start_date
    next_end = payload.end_date if payload.end_date is not None else task.end_date
    _validate_dates(next_start, next_end)

    if payload.title is not None:
        task.title = payload.title
    if payload.done is not None:
        task.done = payload.done
    if payload.start_date is not None:
        task.start_date = payload.start_date
    if payload.end_date is not None:
        task.end_date = payload.end_date

    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"ok": True}
