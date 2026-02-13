from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    return {"message": "Backend çalışıyor 🚀"}

tasks = [
    {"id": 1, "title": "İlk görev", "done": False},
    {"id": 2, "title": "Backend hazırla", "done": True},
]

@app.get("/tasks")
def get_tasks():
    return tasks
from fastapi import HTTPException
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str


class TaskUpdate(BaseModel):
    title: str | None = None
    done: bool | None = None


@app.post("/tasks")
def create_task(payload: TaskCreate):
    new_id = max([t["id"] for t in tasks], default=0) + 1
    task = {"id": new_id, "title": payload.title, "done": False}
    tasks.append(task)
    return task


@app.put("/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate):
    for t in tasks:
        if t["id"] == task_id:
            if payload.title is not None:
                t["title"] = payload.title
            if payload.done is not None:
                t["done"] = payload.done
            return t
    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for i, t in enumerate(tasks):
        if t["id"] == task_id:
            tasks.pop(i)
            return {"ok": True}
    raise HTTPException(status_code=404, detail="Task not found")
