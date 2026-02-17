import { useCallback, useEffect, useMemo, useState } from "react";
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
    subtitle: "Sadece kendi hesabına ait görevleri gör ve yönet.",
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
    themeLight: "Açık Mod",
    themeDark: "Koyu Mod",
    language: "Dil",
    theme: "Tema",
    validationEmptyTitle: "Görev adı boş olamaz.",
    validationMissingDates: "Görev tarihi ve bitiş tarihi gerekli.",
    validationInvalidDates: "Başlangıç tarihi, bitiş tarihinden sonra olamaz.",
    loginTab: "Giriş Yap",
    registerTab: "Kayıt Ol",
    username: "Kullanıcı adı",
    password: "Şifre",
    submitLogin: "Giriş Yap",
    submitRegister: "Kayıt Ol",
    authSubtitle: "Herkes sadece kendi görevlerini görür.",
    logout: "Çıkış Yap",
    loggedInAs: "Giriş yapan",
    authLoading: "İşleniyor...",
    authRequired: "Devam etmek için giriş yapmalısın.",
  },
  en: {
    kicker: "Task command center",
    title: "Task Center",
    subtitle: "See and manage only tasks that belong to your account.",
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
    loginTab: "Login",
    registerTab: "Register",
    username: "Username",
    password: "Password",
    submitLogin: "Login",
    submitRegister: "Register",
    authSubtitle: "Everyone can only see their own tasks.",
    logout: "Logout",
    loggedInAs: "Logged in as",
    authLoading: "Processing...",
    authRequired: "You need to sign in to continue.",
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

function toErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  return fallback;
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

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (username) {
      localStorage.setItem("username", username);
    } else {
      localStorage.removeItem("username");
    }
  }, [username]);

  const logout = () => {
    setToken("");
    setUsername("");
    setTasks([]);
    setError("");
    setLoading(false);
  };

  const apiRequest = useCallback(async (path, options = {}, requiresAuth = true) => {
    const headers = { ...(options.headers || {}) };

    if (requiresAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    let data = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      const detail = data?.detail || `HTTP ${res.status}`;
      if (res.status === 401 && requiresAuth) {
        logout();
      }
      throw new Error(detail);
    }

    return data;
  }, [token]);

  const fetchTasks = useCallback(async () => {
    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/tasks");
      setTasks(data || []);
    } catch (err) {
      setError(toErrorMessage(err, "Request failed"));
    } finally {
      setLoading(false);
    }
  }, [token, apiRequest]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const submitAuth = async (event) => {
    event.preventDefault();

    if (!authUsername.trim() || !authPassword) {
      setAuthError(t.authRequired);
      return;
    }

    try {
      setAuthBusy(true);
      setAuthError("");

      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const data = await apiRequest(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: authUsername.trim(),
            password: authPassword,
          }),
        },
        false,
      );

      setToken(data.access_token);
      setUsername(data.username);
      setAuthPassword("");
      setAuthError("");
    } catch (err) {
      setAuthError(toErrorMessage(err, t.error));
    } finally {
      setAuthBusy(false);
    }
  };

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
      const newTask = await apiRequest("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanedTitle,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      setTasks((prev) => [...prev, newTask]);
      setTitle("");
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    } finally {
      setBusyId(null);
    }
  };

  const toggleTask = async (task) => {
    try {
      setBusyId(task.id);
      setError("");
      const updatedTask = await apiRequest(`/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });

      setTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    } finally {
      setBusyId(null);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setBusyId(taskId);
      setError("");
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((item) => item.id !== taskId));
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    } finally {
      setBusyId(null);
    }
  };

  const renderHeaderTools = () => (
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
  );

  if (!token) {
    return (
      <div className={`app-shell theme-${theme}`}>
        <div className="ambient ambient-left" aria-hidden="true" />
        <div className="ambient ambient-right" aria-hidden="true" />

        <main className="board auth-board">
          {renderHeaderTools()}

          <header className="board-header">
            <p className="kicker">{t.kicker}</p>
            <h1>{t.title}</h1>
            <p className="subtitle">{t.authSubtitle}</p>
          </header>

          <section className="auth-card">
            <div className="auth-tabs" role="tablist" aria-label="auth modes">
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
              >
                {t.loginTab}
              </button>
              <button
                type="button"
                className={authMode === "register" ? "active" : ""}
                onClick={() => setAuthMode("register")}
              >
                {t.registerTab}
              </button>
            </div>

            <form className="auth-form" onSubmit={submitAuth}>
              <input
                type="text"
                value={authUsername}
                onChange={(event) => setAuthUsername(event.target.value)}
                placeholder={t.username}
                aria-label={t.username}
                autoComplete="username"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder={t.password}
                aria-label={t.password}
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
              />

              <button type="submit" disabled={authBusy}>
                {authBusy ? t.authLoading : authMode === "login" ? t.submitLogin : t.submitRegister}
              </button>
            </form>

            {authError ? (
              <p className="error-banner">
                {t.error}: {authError}
              </p>
            ) : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <main className="board">
        {renderHeaderTools()}

        <header className="board-header">
          <div className="session-actions">
            <span>
              {t.loggedInAs}: <strong>{username}</strong>
            </span>
            <button type="button" className="logout-btn" onClick={logout}>
              {t.logout}
            </button>
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

        {error ? (
          <p className="error-banner">
            {t.error}: {error}
          </p>
        ) : null}

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

