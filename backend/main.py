from datetime import date, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Backend çalışıyor"}


def _seed_tasks() -> list[dict]:
    today = date.today()
    return [
        {
            "id": 1,
            "title": "İlk görev",
            "done": False,
            "start_date": today,
            "end_date": today + timedelta(days=2),
        },
        {
            "id": 2,
            "title": "Backend hazırla",
            "done": True,
            "start_date": today - timedelta(days=5),
            "end_date": today - timedelta(days=1),
        },
    ]


tasks = _seed_tasks()


class TaskCreate(BaseModel):
    title: str
    start_date: date
    end_date: date


class TaskUpdate(BaseModel):
    title: str | None = None
    done: bool | None = None
    start_date: date | None = None
    end_date: date | None = None


def _validate_dates(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Başlangıç tarihi bitiş tarihinden sonra olamaz")


@app.get("/tasks")
def get_tasks():
    return tasks


@app.post("/tasks")
def create_task(payload: TaskCreate):
    _validate_dates(payload.start_date, payload.end_date)

    new_id = max([t["id"] for t in tasks], default=0) + 1
    task = {
        "id": new_id,
        "title": payload.title,
        "done": False,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
    }
    tasks.append(task)
    return task


@app.put("/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate):
    for task in tasks:
        if task["id"] == task_id:
            next_start = payload.start_date if payload.start_date is not None else task["start_date"]
            next_end = payload.end_date if payload.end_date is not None else task["end_date"]
            _validate_dates(next_start, next_end)

            if payload.title is not None:
                task["title"] = payload.title
            if payload.done is not None:
                task["done"] = payload.done
            if payload.start_date is not None:
                task["start_date"] = payload.start_date
            if payload.end_date is not None:
                task["end_date"] = payload.end_date
            return task

    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for index, task in enumerate(tasks):
        if task["id"] == task_id:
            tasks.pop(index)
            return {"ok": True}

    raise HTTPException(status_code=404, detail="Task not found")
