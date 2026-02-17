import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";
const WEEK_DAYS = ["Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt", "Paz"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIsoDate(input) {
  const date = new Date(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayIso() {
  return toIsoDate(new Date());
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const mondayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const startDay = new Date(year, month, 1 - mondayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDay);
    day.setDate(startDay.getDate() + index);

    return {
      date: day,
      iso: toIsoDate(day),
      inCurrentMonth: day.getMonth() === month,
    };
  });
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/tasks`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const visibleTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((task) => !task.done);
    if (filter === "done") return tasks.filter((task) => task.done);
    return tasks;
  }, [tasks, filter]);

  const tasksByEndDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!task.end_date) return acc;
      if (!acc[task.end_date]) {
        acc[task.end_date] = [];
      }
      acc[task.end_date].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const active = total - done;
    return { total, done, active };
  }, [tasks]);

  const calendarDays = useMemo(() => buildCalendarDays(activeMonth), [activeMonth]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
      activeMonth,
    );
  }, [activeMonth]);

  const createTask = async (event) => {
    event.preventDefault();
    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      setError("Görev adı boş olamaz.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Görev tarihi ve bitiş tarihi gerekli.");
      return;
    }

    if (startDate > endDate) {
      setError("Başlangıç tarihi, bitiş tarihinden sonra olamaz.");
      return;
    }

    try {
      setBusyId("create");
      setError("");
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanedTitle,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setTitle("");
    } catch (err) {
      setError(String(err));
    } finally {
      setBusyId(null);
    }
  };

  const toggleTask = async (task) => {
    try {
      setBusyId(task.id);
      setError("");
      const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const updatedTask = await res.json();
      setTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));
    } catch (err) {
      setError(String(err));
    } finally {
      setBusyId(null);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setBusyId(taskId);
      setError("");
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setTasks((prev) => prev.filter((item) => item.id !== taskId));
    } catch (err) {
      setError(String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <main className="board">
        <header className="board-header">
          <p className="kicker">Task command center</p>
          <h1>Görev Merkezi</h1>
          <p className="subtitle">Görev adı, başlangıç ve bitiş tarihi ile planını netleştir.</p>
        </header>

        <section className="stats-grid" aria-label="Task stats">
          <article className="stat-card">
            <span>Total</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>Active</span>
            <strong>{stats.active}</strong>
          </article>
          <article className="stat-card">
            <span>Done</span>
            <strong>{stats.done}</strong>
          </article>
        </section>

        <section className="control-panel">
          <form className="create-form" onSubmit={createTask}>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Görev adı"
              aria-label="Görev adı"
            />

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label="Görev tarihi"
            />

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              aria-label="Görev bitiş tarihi"
            />

            <button type="submit" disabled={busyId === "create"}>
              {busyId === "create" ? "Ekleniyor..." : "Görev Ekle"}
            </button>
          </form>

          <div className="filters" role="tablist" aria-label="Task filters">
            {[
              { key: "all", label: "Hepsi" },
              { key: "active", label: "Aktif" },
              { key: "done", label: "Tamamlanan" },
            ].map((option) => (
              <button
                key={option.key}
                className={filter === option.key ? "active" : ""}
                onClick={() => setFilter(option.key)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="error-banner">Hata: {error}</p>}

        <section className="task-list" aria-live="polite">
          {loading ? <p className="empty-state">Görevler yükleniyor...</p> : null}

          {!loading && visibleTasks.length === 0 ? (
            <p className="empty-state">Bu filtrede görev bulunmuyor.</p>
          ) : null}

          {visibleTasks.map((task) => (
            <article key={task.id} className={`task-card ${task.done ? "done" : ""}`}>
              <button
                className="task-check"
                type="button"
                onClick={() => toggleTask(task)}
                disabled={busyId === task.id}
                aria-label={`${task.title} durumunu değiştir`}
              >
                {task.done ? "Done" : "Open"}
              </button>

              <div className="task-content">
                <p>{task.title}</p>
                <small>
                  {task.start_date} - {task.end_date}
                </small>
              </div>

              <button
                className="task-delete"
                type="button"
                onClick={() => deleteTask(task.id)}
                disabled={busyId === task.id}
              >
                Sil
              </button>
            </article>
          ))}
        </section>

        <section className="calendar-panel" aria-label="Aylık takvim">
          <header className="calendar-header">
            <button
              type="button"
              onClick={() =>
                setActiveMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              aria-label="Önceki ay"
            >
              &lt;
            </button>

            <h2>{monthLabel}</h2>

            <button
              type="button"
              onClick={() =>
                setActiveMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              aria-label="Sonraki ay"
            >
              &gt;
            </button>
          </header>

          <div className="calendar-grid">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}

            {calendarDays.map((day) => {
              const dayTasks = tasksByEndDate[day.iso] || [];
              const isToday = day.iso === todayIso();

              return (
                <article
                  key={day.iso}
                  className={`calendar-cell ${day.inCurrentMonth ? "" : "muted"} ${
                    isToday ? "today" : ""
                  }`}
                >
                  <strong className="calendar-day-number">{day.date.getDate()}</strong>

                  <div className="calendar-events">
                    {dayTasks.slice(0, 2).map((task) => (
                      <p key={task.id} className={`calendar-event ${task.done ? "done" : ""}`}>
                        {task.title}
                      </p>
                    ))}
                    {dayTasks.length > 2 ? (
                      <p className="calendar-more">+{dayTasks.length - 2} daha</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
