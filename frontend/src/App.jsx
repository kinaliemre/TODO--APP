import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";
const LOCALES = { tr: "tr-TR", en: "en-US" };
const WEEK_DAYS = {
  tr: ["Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt", "Paz"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const TRANSLATIONS = {
  tr: {
    kicker: "Task command center",
    title: "Görev Merkezi",
    subtitle: "Görev adı, başlangıç ve bitiş tarihi ile planını netleştir.",
    total: "Toplam",
    active: "Aktif",
    done: "Tamamlanan",
    taskName: "Görev adı",
    taskDate: "Görev tarihi",
    endDate: "Görev bitiş tarihi",
    addTask: "Görev Ekle",
    adding: "Ekleniyor...",
    all: "Hepsi",
    filterActive: "Aktif",
    filterDone: "Tamamlanan",
    error: "Hata",
    loading: "Görevler yükleniyor...",
    noTasks: "Bu filtrede görev bulunmuyor.",
    delete: "Sil",
    monthlyCalendar: "Aylık takvim",
    prevMonth: "Önceki ay",
    nextMonth: "Sonraki ay",
    more: "daha",
    open: "Açık",
    statusDone: "Bitti",
    toggleTask: "durumunu değiştir",
    themeColor: "Renkli",
    themeLight: "Açık Mod",
    themeDark: "Koyu Mod",
    language: "Dil",
    theme: "Tema",
    validationEmptyTitle: "Görev adı boş olamaz.",
    validationMissingDates: "Görev tarihi ve bitiş tarihi gerekli.",
    validationInvalidDates: "Başlangıç tarihi, bitiş tarihinden sonra olamaz.",
  },
  en: {
    kicker: "Task command center",
    title: "Task Center",
    subtitle: "Plan clearly with task name, start date, and end date.",
    total: "Total",
    active: "Active",
    done: "Done",
    taskName: "Task name",
    taskDate: "Start date",
    endDate: "End date",
    addTask: "Add Task",
    adding: "Adding...",
    all: "All",
    filterActive: "Active",
    filterDone: "Done",
    error: "Error",
    loading: "Loading tasks...",
    noTasks: "No tasks in this filter.",
    delete: "Delete",
    monthlyCalendar: "Monthly calendar",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    more: "more",
    open: "Open",
    statusDone: "Done",
    toggleTask: "toggle status",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    language: "Language",
    theme: "Theme",
    validationEmptyTitle: "Task title cannot be empty.",
    validationMissingDates: "Task date and end date are required.",
    validationInvalidDates: "Start date cannot be after end date.",
  },
};

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
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "tr");
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

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
    return new Intl.DateTimeFormat(LOCALES[lang], { month: "long", year: "numeric" }).format(
      activeMonth,
    );
  }, [activeMonth, lang]);

  const createTask = async (event) => {
    event.preventDefault();
    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      setError(t.validationEmptyTitle);
      return;
    }

    if (!startDate || !endDate) {
      setError(t.validationMissingDates);
      return;
    }

    if (startDate > endDate) {
      setError(t.validationInvalidDates);
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
    <div className={`app-shell theme-${theme}`}>
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <main className="board">
        <header className="board-header">
          <div className="header-tools">
            <div className="switch-group" role="group" aria-label={t.theme}>
              <button
                type="button"
                className={theme === "light" ? "switch-btn active" : "switch-btn"}
                onClick={() => setTheme("light")}
              >
                {t.themeLight}
              </button>
              <button
                type="button"
                className={theme === "dark" ? "switch-btn active" : "switch-btn"}
                onClick={() => setTheme("dark")}
              >
                {t.themeDark}
              </button>
            </div>
            <div className="switch-group" role="group" aria-label={t.language}>
              <button
                type="button"
                className={lang === "tr" ? "switch-btn active" : "switch-btn"}
                onClick={() => setLang("tr")}
              >
                TR
              </button>
              <button
                type="button"
                className={lang === "en" ? "switch-btn active" : "switch-btn"}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
          </div>
          <p className="kicker">{t.kicker}</p>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </header>

        <section className="stats-grid" aria-label="Task stats">
          <article className="stat-card">
            <span>{t.total}</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>{t.active}</span>
            <strong>{stats.active}</strong>
          </article>
          <article className="stat-card">
            <span>{t.done}</span>
            <strong>{stats.done}</strong>
          </article>
        </section>

        <section className="control-panel">
          <form className="create-form" onSubmit={createTask}>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t.taskName}
              aria-label={t.taskName}
            />

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label={t.taskDate}
            />

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              aria-label={t.endDate}
            />

            <button type="submit" disabled={busyId === "create"}>
              {busyId === "create" ? t.adding : t.addTask}
            </button>
          </form>

          <div className="filters" role="tablist" aria-label="Task filters">
            {[
              { key: "all", label: t.all },
              { key: "active", label: t.filterActive },
              { key: "done", label: t.filterDone },
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

        {error && (
          <p className="error-banner">
            {t.error}: {error}
          </p>
        )}

        <section className="task-list" aria-live="polite">
          {loading ? <p className="empty-state">{t.loading}</p> : null}

          {!loading && visibleTasks.length === 0 ? <p className="empty-state">{t.noTasks}</p> : null}

          {visibleTasks.map((task) => (
            <article key={task.id} className={`task-card ${task.done ? "done" : ""}`}>
              <button
                className="task-check"
                type="button"
                onClick={() => toggleTask(task)}
                disabled={busyId === task.id}
                aria-label={`${task.title} ${t.toggleTask}`}
              >
                {task.done ? t.statusDone : t.open}
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
                {t.delete}
              </button>
            </article>
          ))}
        </section>

        <section className="calendar-panel" aria-label={t.monthlyCalendar}>
          <header className="calendar-header">
            <button
              type="button"
              onClick={() =>
                setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              aria-label={t.prevMonth}
            >
              &lt;
            </button>

            <h2>{monthLabel}</h2>

            <button
              type="button"
              onClick={() =>
                setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              aria-label={t.nextMonth}
            >
              &gt;
            </button>
          </header>

          <div className="calendar-grid">
            {WEEK_DAYS[lang].map((day) => (
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
                      <p className="calendar-more">
                        +{dayTasks.length - 2} {t.more}
                      </p>
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
