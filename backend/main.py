import base64
import hashlib
import hmac
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Generator, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, joinedload, mapped_column, relationship, sessionmaker

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres@localhost:5432/todo_app")
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    tasks: Mapped[list["Task"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    priority: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    tags: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    notes: Mapped[str] = mapped_column(String(2000), default="", nullable=False)
    recurring: Mapped[str] = mapped_column(String(16), default="none", nullable=False)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    user: Mapped[User] = relationship(back_populates="tasks")
    attachments: Mapped[list["TaskAttachment"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )


class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(128), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    task: Mapped[Task] = relationship(back_populates="attachments")


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


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _validate_dates(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Başlangıç tarihi bitiş tarihinden sonra olamaz")


def _normalize_tags(tags: list[str]) -> str:
    cleaned = []
    seen: set[str] = set()
    for tag in tags:
        normalized = tag.strip().lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        cleaned.append(normalized)
    return ",".join(cleaned)


def _split_tags(tags_csv: str) -> list[str]:
    if not tags_csv:
        return []
    return [item for item in tags_csv.split(",") if item]


def hash_password(password: str) -> str:
    iterations = 120_000
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    salt_b64 = base64.b64encode(salt).decode("utf-8")
    digest_b64 = base64.b64encode(digest).decode("utf-8")
    return f"pbkdf2_sha256${iterations}${salt_b64}${digest_b64}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        _, iteration_str, salt_b64, digest_b64 = hashed_password.split("$", maxsplit=3)
        iterations = int(iteration_str)
        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected_digest = base64.b64decode(digest_b64.encode("utf-8"))
    except (ValueError, TypeError):
        return False

    candidate_digest = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(candidate_digest, expected_digest)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def task_to_out(task: Task) -> TaskOut:
    return TaskOut(
        id=task.id,
        title=task.title,
        done=task.done,
        start_date=task.start_date,
        end_date=task.end_date,
        priority=task.priority,
        tags=_split_tags(task.tags),
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


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz oturum",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_error
    except JWTError as exc:
        raise credentials_error from exc

    user = db.scalar(select(User).where(User.username == username))
    if user is None:
        raise credentials_error

    return user


def _get_user_task_or_404(db: Session, current_user: User, task_id: int) -> Task:
    query = (
        select(Task)
        .options(joinedload(Task.attachments))
        .where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = db.scalar(query)
    if task is None:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    return task


@app.on_event("startup")
def startup() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(16) DEFAULT 'medium'"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT ''"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes VARCHAR(2000) DEFAULT ''"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring VARCHAR(16) DEFAULT 'none'"))


@app.get("/")
def root() -> MessageOut:
    return {"message": "Backend çalışıyor"}


@app.post("/auth/register", response_model=TokenOut)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Kullanıcı adı boş olamaz")

    existing = db.scalar(select(User).where(User.username == username))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Kullanıcı adı zaten kayıtlı")

    user = User(username=username, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()

    token = create_access_token(user.username)
    return TokenOut(access_token=token, username=user.username)


@app.post("/auth/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == payload.username.strip()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")

    token = create_access_token(user.username)
    return TokenOut(access_token=token, username=user.username)


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(id=current_user.id, username=current_user.username)


@app.put("/profile", response_model=UserOut)
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


@app.put("/profile/password", response_model=MessageOut)
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


@app.delete("/profile", response_model=MessageOut)
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


@app.get("/notifications", response_model=list[NotificationOut])
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


@app.get("/tasks", response_model=list[TaskOut])
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


@app.post("/tasks", response_model=TaskOut)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_dates(payload.start_date, payload.end_date)

    task = Task(
        title=payload.title.strip(),
        done=False,
        start_date=payload.start_date,
        end_date=payload.end_date,
        priority=payload.priority,
        tags=_normalize_tags(payload.tags),
        notes=payload.notes.strip(),
        recurring=payload.recurring,
        user_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    db.refresh(task, attribute_names=["attachments"])
    return task_to_out(task)


@app.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_user_task_or_404(db, current_user, task_id)

    next_start = payload.start_date if payload.start_date is not None else task.start_date
    next_end = payload.end_date if payload.end_date is not None else task.end_date
    _validate_dates(next_start, next_end)

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
        task.tags = _normalize_tags(payload.tags)
    if payload.notes is not None:
        task.notes = payload.notes.strip()
    if payload.recurring is not None:
        task.recurring = payload.recurring

    db.commit()
    db.refresh(task)
    db.refresh(task, attribute_names=["attachments"])
    return task_to_out(task)


@app.delete("/tasks/{task_id}", response_model=MessageOut)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_user_task_or_404(db, current_user, task_id)

    for attachment in task.attachments:
        path = Path(attachment.file_path)
        if path.exists():
            path.unlink(missing_ok=True)

    db.delete(task)
    db.commit()
    return {"message": "Görev silindi"}


@app.post("/tasks/{task_id}/attachments", response_model=TaskOut)
def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_user_task_or_404(db, current_user, task_id)

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


@app.get("/attachments/{attachment_id}")
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


@app.delete("/attachments/{attachment_id}", response_model=TaskOut)
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
    file_path = Path(attachment.file_path)
    if file_path.exists():
        file_path.unlink(missing_ok=True)

    db.delete(attachment)
    db.commit()
    db.refresh(task)
    db.refresh(task, attribute_names=["attachments"])
    return task_to_out(task)
