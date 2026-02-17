from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class ProfileUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=32)


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class UserOut(BaseModel):
    id: int
    username: str


class AttachmentOut(BaseModel):
    id: int
    file_name: str
    content_type: str
    size_bytes: int
    created_at: datetime


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    start_date: date
    end_date: date
    priority: Literal["low", "medium", "high"] = "medium"
    tags: list[str] = Field(default_factory=list)
    notes: str = ""
    recurring: Literal["none", "daily", "weekly", "monthly"] = "none"


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    done: bool | None = None
    start_date: date | None = None
    end_date: date | None = None
    priority: Literal["low", "medium", "high"] | None = None
    tags: list[str] | None = None
    notes: str | None = None
    recurring: Literal["none", "daily", "weekly", "monthly"] | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    done: bool
    start_date: date
    end_date: date
    priority: str
    tags: list[str]
    notes: str
    recurring: str
    attachments: list[AttachmentOut]


class NotificationOut(BaseModel):
    task_id: int
    title: str
    due_date: date
    level: Literal["overdue", "soon"]
    message: str


class MessageOut(BaseModel):
    message: str

