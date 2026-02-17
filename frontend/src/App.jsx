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
    title: "Görev Merkezi",
    subtitle: "Kendi hesabına özel görevleri yönet.",
    total: "Toplam",
    active: "Aktif",
    done: "Tamamlanan",
    taskName: "Görev adı",
    taskDate: "Başlangıç",
    endDate: "Bitiş",
    addTask: "Görev Ekle",
    adding: "Ekleniyor...",
    all: "Hepsi",
    filterActive: "Aktif",
    filterDone: "Tamamlanan",
    error: "Hata",
    loading: "Yükleniyor...",
    noTasks: "Görev bulunamadı.",
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
    loginTab: "Giriş Yap",
    registerTab: "Kayıt Ol",
    username: "Kullanıcı adı",
    password: "Şifre",
    submitLogin: "Giriş Yap",
    submitRegister: "Kayıt Ol",
    authSubtitle: "Herkes yalnızca kendi görevlerini görür.",
    logout: "Çıkış Yap",
    loggedInAs: "Kullanıcı",
    authLoading: "İşleniyor...",
    authRequired: "Kullanıcı adı ve şifre gerekli.",
    profile: "Profil",
    newUsername: "Yeni kullanıcı adı",
    saveUsername: "Kullanıcı adını güncelle",
    currentPassword: "Mevcut şifre",
    newPassword: "Yeni şifre",
    savePassword: "Şifreyi güncelle",
    deleteAccount: "Hesabı sil",
    profileOk: "Profil güncellendi",
    notifications: "Bildirimler",
    overdue: "Geciken",
    dueSoon: "Yaklaşan",
    searchPlaceholder: "Görev veya not ara",
    tagFilter: "Etiket filtresi",
    sortCreatedDesc: "Yeni kayıt",
    sortCreatedAsc: "Eski kayıt",
    sortDueAsc: "Bitiş yakında",
    sortDueDesc: "Bitiş uzakta",
    priorityLow: "Düşük",
    priorityMedium: "Orta",
    priorityHigh: "Yüksek",
    recurringNone: "Yok",
    recurringDaily: "Günlük",
    recurringWeekly: "Haftalık",
    recurringMonthly: "Aylık",
    tags: "Etiketler (virgül ile)",
    notes: "Not",
    attachments: "Dosyalar",
    upload: "Yükle",
    downloading: "İndir",
    removeFile: "Dosyayı sil",
    noNotifications: "Bildirim yok.",
    noFiles: "Dosya yok.",
  },
  en: {
    title: "Task Center",
    subtitle: "Manage tasks that belong only to your account.",
    total: "Total",
    active: "Active",
    done: "Done",
    taskName: "Task name",
    taskDate: "Start",
    endDate: "End",
    addTask: "Add Task",
    adding: "Adding...",
    all: "All",
    filterActive: "Active",
    filterDone: "Done",
    error: "Error",
    loading: "Loading...",
    noTasks: "No tasks found.",
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
    loginTab: "Login",
    registerTab: "Register",
    username: "Username",
    password: "Password",
    submitLogin: "Login",
    submitRegister: "Register",
    authSubtitle: "Everyone only sees their own tasks.",
    logout: "Logout",
    loggedInAs: "User",
    authLoading: "Processing...",
    authRequired: "Username and password are required.",
    profile: "Profile",
    newUsername: "New username",
    saveUsername: "Update username",
    currentPassword: "Current password",
    newPassword: "New password",
    savePassword: "Update password",
    deleteAccount: "Delete account",
    profileOk: "Profile updated",
    notifications: "Notifications",
    overdue: "Overdue",
    dueSoon: "Due soon",
    searchPlaceholder: "Search task or notes",
    tagFilter: "Tag filter",
    sortCreatedDesc: "Newest",
    sortCreatedAsc: "Oldest",
    sortDueAsc: "Due soonest",
    sortDueDesc: "Due latest",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    recurringNone: "None",
    recurringDaily: "Daily",
    recurringWeekly: "Weekly",
    recurringMonthly: "Monthly",
    tags: "Tags (comma separated)",
    notes: "Notes",
    attachments: "Attachments",
    upload: "Upload",
    downloading: "Download",
    removeFile: "Remove file",
    noNotifications: "No notifications.",
    noFiles: "No files.",
  },
};

const PRIORITY_OPTIONS = ["low", "medium", "high"];
const RECUR_OPTIONS = ["none", "daily", "weekly", "monthly"];

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

function splitTagsInput(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [priority, setPriority] = useState("medium");
  const [recurring, setRecurring] = useState("none");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [searchPriority, setSearchPriority] = useState("all");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [sortBy, setSortBy] = useState("created_desc");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);

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

  const [profileUsername, setProfileUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});

  const t = TRANSLATIONS[lang];
  const priorityLabel = { low: t.priorityLow, medium: t.priorityMedium, high: t.priorityHigh };
  const recurringLabel = {
    none: t.recurringNone,
    daily: t.recurringDaily,
    weekly: t.recurringWeekly,
    monthly: t.recurringMonthly,
  };

  useEffect(() => localStorage.setItem("theme", theme), [theme]);
  useEffect(() => localStorage.setItem("lang", lang), [lang]);
  useEffect(() => (token ? localStorage.setItem("token", token) : localStorage.removeItem("token")), [token]);
  useEffect(
    () => (username ? localStorage.setItem("username", username) : localStorage.removeItem("username")),
    [username],
  );

  const logout = useCallback(() => {
    setToken("");
    setUsername("");
    setTasks([]);
    setNotifications([]);
    setError("");
    setSuccess("");
    setLoading(false);
  }, []);

  const apiRequest = useCallback(
    async (path, options = {}, requiresAuth = true) => {
      const headers = { ...(options.headers || {}) };
      if (requiresAuth && token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) {
        const detail = data?.detail || `HTTP ${res.status}`;
        if (res.status === 401 && requiresAuth) logout();
        throw new Error(detail);
      }
      return data;
    },
    [token, logout],
  );

  const fetchTasks = useCallback(async () => {
    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        status_filter: filter,
        priority: searchPriority,
        sort: sortBy,
      });
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (searchTag.trim()) params.set("tag", searchTag.trim());
      if (dueFrom) params.set("due_from", dueFrom);
      if (dueTo) params.set("due_to", dueTo);
      const data = await apiRequest(`/tasks?${params.toString()}`);
      setTasks(data || []);
    } catch (err) {
      setError(toErrorMessage(err, "Request failed"));
    } finally {
      setLoading(false);
    }
  }, [token, filter, searchPriority, sortBy, searchQuery, searchTag, dueFrom, dueTo, apiRequest]);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const data = await apiRequest("/notifications");
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    }
  }, [token, apiRequest]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    setProfileUsername(username);
  }, [username]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    return { total, done, active: total - done };
  }, [tasks]);

  const tasksByEndDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!task.end_date) return acc;
      if (!acc[task.end_date]) acc[task.end_date] = [];
      acc[task.end_date].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const calendarDays = useMemo(() => buildCalendarDays(activeMonth), [activeMonth]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(LOCALES[lang], { month: "long", year: "numeric" }).format(activeMonth),
    [activeMonth, lang],
  );

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
          body: JSON.stringify({ username: authUsername.trim(), password: authPassword }),
        },
        false,
      );
      setToken(data.access_token);
      setUsername(data.username);
      setAuthPassword("");
    } catch (err) {
      setAuthError(toErrorMessage(err, t.error));
    } finally {
      setAuthBusy(false);
    }
  };

  const updateUsername = async (event) => {
    event.preventDefault();
    try {
      const data = await apiRequest("/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: profileUsername }),
      });
      setUsername(data.username);
      setSuccess(t.profileOk);
      setError("");
    } catch (err) {
      setError(toErrorMessage(err, t.error));
      setSuccess("");
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    try {
      const data = await apiRequest("/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setSuccess(data.message || t.profileOk);
      setCurrentPassword("");
      setNewPassword("");
      setError("");
    } catch (err) {
      setError(toErrorMessage(err, t.error));
      setSuccess("");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm(t.deleteAccount)) return;
    try {
      await apiRequest("/profile", { method: "DELETE" });
      logout();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      setBusyId("create");
      setError("");
      await apiRequest("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          start_date: startDate,
          end_date: endDate,
          priority,
          tags: splitTagsInput(tagsInput),
          notes,
          recurring,
        }),
      });
      setTitle("");
      setTagsInput("");
      setNotes("");
      setPriority("medium");
      setRecurring("none");
      await fetchTasks();
      await fetchNotifications();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    } finally {
      setBusyId(null);
    }
  };

  const updateTaskState = async (taskId, payload) => {
    try {
      setBusyId(taskId);
      await apiRequest(`/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchTasks();
      await fetchNotifications();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    } finally {
      setBusyId(null);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setBusyId(taskId);
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      await fetchTasks();
      await fetchNotifications();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    } finally {
      setBusyId(null);
    }
  };

  const uploadAttachment = async (taskId) => {
    const file = selectedFiles[taskId];
    if (!file) return;
    try {
      setUploadingTaskId(taskId);
      const form = new FormData();
      form.append("file", file);
      await apiRequest(`/tasks/${taskId}/attachments`, { method: "POST", body: form });
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      await fetchTasks();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    } finally {
      setUploadingTaskId(null);
    }
  };

  const removeAttachment = async (attachmentId) => {
    try {
      await apiRequest(`/attachments/${attachmentId}`, { method: "DELETE" });
      await fetchTasks();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    }
  };

  const downloadAttachment = async (attachment) => {
    try {
      const res = await fetch(`${API_BASE}/attachments/${attachment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    }
  };

  const renderHeaderTools = () => (
    <div className="header-tools">
      <div className="switch-group" role="group" aria-label={t.theme}>
        <button type="button" className={theme === "light" ? "switch-btn active" : "switch-btn"} onClick={() => setTheme("light")}>
          {t.themeLight}
        </button>
        <button type="button" className={theme === "dark" ? "switch-btn active" : "switch-btn"} onClick={() => setTheme("dark")}>
          {t.themeDark}
        </button>
      </div>
      <div className="switch-group" role="group" aria-label={t.language}>
        <button type="button" className={lang === "tr" ? "switch-btn active" : "switch-btn"} onClick={() => setLang("tr")}>TR</button>
        <button type="button" className={lang === "en" ? "switch-btn active" : "switch-btn"} onClick={() => setLang("en")}>EN</button>
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
            <h1>{t.title}</h1>
            <p className="subtitle">{t.authSubtitle}</p>
          </header>
          <section className="auth-card">
            <div className="auth-tabs">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>{t.loginTab}</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>{t.registerTab}</button>
            </div>
            <form className="auth-form" onSubmit={submitAuth}>
              <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder={t.username} />
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder={t.password} />
              <button type="submit" disabled={authBusy}>{authBusy ? t.authLoading : authMode === "login" ? t.submitLogin : t.submitRegister}</button>
            </form>
            {authError ? <p className="error-banner">{t.error}: {authError}</p> : null}
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
            <span>{t.loggedInAs}: <strong>{username}</strong></span>
            <button type="button" className="logout-btn" onClick={logout}>{t.logout}</button>
          </div>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </header>

        <section className="notifications-panel">
          <h3>{t.notifications}</h3>
          {notifications.length === 0 ? <p className="empty-state">{t.noNotifications}</p> : null}
          {notifications.map((item) => (
            <div key={`${item.task_id}-${item.level}`} className={`notice ${item.level}`}>
              <strong>{item.level === "overdue" ? t.overdue : t.dueSoon}</strong> - {item.title} ({item.due_date})
            </div>
          ))}
        </section>

        <section className="profile-grid">
          <form className="profile-card" onSubmit={updateUsername}>
            <h3>{t.profile}</h3>
            <input type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} placeholder={t.newUsername} />
            <button type="submit">{t.saveUsername}</button>
          </form>
          <form className="profile-card" onSubmit={updatePassword}>
            <h3>{t.password}</h3>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t.currentPassword} />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t.newPassword} />
            <button type="submit">{t.savePassword}</button>
          </form>
          <div className="profile-card danger-card">
            <h3>{t.deleteAccount}</h3>
            <button type="button" className="danger-btn" onClick={deleteAccount}>{t.deleteAccount}</button>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card"><span>{t.total}</span><strong>{stats.total}</strong></article>
          <article className="stat-card"><span>{t.active}</span><strong>{stats.active}</strong></article>
          <article className="stat-card"><span>{t.done}</span><strong>{stats.done}</strong></article>
        </section>

        <section className="search-panel">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} />
          <input value={searchTag} onChange={(e) => setSearchTag(e.target.value)} placeholder={t.tagFilter} />
          <select value={searchPriority} onChange={(e) => setSearchPriority(e.target.value)}>
            <option value="all">{t.all}</option>
            {PRIORITY_OPTIONS.map((item) => <option key={item} value={item}>{priorityLabel[item]}</option>)}
          </select>
          <input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
          <input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_desc">{t.sortCreatedDesc}</option>
            <option value="created_asc">{t.sortCreatedAsc}</option>
            <option value="due_asc">{t.sortDueAsc}</option>
            <option value="due_desc">{t.sortDueDesc}</option>
          </select>
        </section>

        <section className="control-panel">
          <form className="create-form advanced" onSubmit={createTask}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.taskName} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((item) => <option key={item} value={item}>{priorityLabel[item]}</option>)}
            </select>
            <select value={recurring} onChange={(e) => setRecurring(e.target.value)}>
              {RECUR_OPTIONS.map((item) => <option key={item} value={item}>{recurringLabel[item]}</option>)}
            </select>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder={t.tags} />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notes} />
            <button type="submit" disabled={busyId === "create"}>{busyId === "create" ? t.adding : t.addTask}</button>
          </form>
          <div className="filters">
            {[{ key: "all", label: t.all }, { key: "active", label: t.filterActive }, { key: "done", label: t.filterDone }].map((option) => (
              <button key={option.key} className={filter === option.key ? "active" : ""} onClick={() => setFilter(option.key)} type="button">{option.label}</button>
            ))}
          </div>
        </section>

        {error ? <p className="error-banner">{t.error}: {error}</p> : null}
        {success ? <p className="success-banner">{success}</p> : null}

        <section className="task-list">
          {loading ? <p className="empty-state">{t.loading}</p> : null}
          {!loading && tasks.length === 0 ? <p className="empty-state">{t.noTasks}</p> : null}
          {tasks.map((task) => (
            <article key={task.id} className={`task-card ${task.done ? "done" : ""}`}>
              <button className="task-check" type="button" onClick={() => updateTaskState(task.id, { done: !task.done })} disabled={busyId === task.id}>
                {task.done ? t.statusDone : t.open}
              </button>
              <div className="task-content">
                <p>{task.title}</p>
                <small>{task.start_date} - {task.end_date}</small>
                <div className="task-meta">
                  <span className={`chip chip-${task.priority}`}>{priorityLabel[task.priority]}</span>
                  <span className="chip">{recurringLabel[task.recurring]}</span>
                  {task.tags.map((tag) => <span key={tag} className="chip tag-chip">#{tag}</span>)}
                </div>
                {task.notes ? <p className="task-notes">{task.notes}</p> : null}
                <div className="attachments">
                  <strong>{t.attachments}</strong>
                  <div className="file-row">
                    <input type="file" onChange={(e) => setSelectedFiles((prev) => ({ ...prev, [task.id]: e.target.files?.[0] || null }))} />
                    <button type="button" onClick={() => uploadAttachment(task.id)} disabled={uploadingTaskId === task.id || !selectedFiles[task.id]}>{t.upload}</button>
                  </div>
                  {task.attachments.length === 0 ? <small>{t.noFiles}</small> : null}
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className="attachment-item">
                      <span>{attachment.file_name}</span>
                      <div>
                        <button type="button" onClick={() => downloadAttachment(attachment)}>{t.downloading}</button>
                        <button type="button" onClick={() => removeAttachment(attachment.id)}>{t.removeFile}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="task-delete" type="button" onClick={() => deleteTask(task.id)} disabled={busyId === task.id}>{t.delete}</button>
            </article>
          ))}
        </section>

        <section className="calendar-panel" aria-label={t.monthlyCalendar}>
          <header className="calendar-header">
            <button type="button" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} aria-label={t.prevMonth}>&lt;</button>
            <h2>{monthLabel}</h2>
            <button type="button" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} aria-label={t.nextMonth}>&gt;</button>
          </header>
          <div className="calendar-grid">
            {WEEK_DAYS[lang].map((day) => <div key={day} className="calendar-weekday">{day}</div>)}
            {calendarDays.map((day) => {
              const dayTasks = tasksByEndDate[day.iso] || [];
              const isToday = day.iso === todayIso();
              return (
                <article key={day.iso} className={`calendar-cell ${day.inCurrentMonth ? "" : "muted"} ${isToday ? "today" : ""}`}>
                  <strong className="calendar-day-number">{day.date.getDate()}</strong>
                  <div className="calendar-events">
                    {dayTasks.slice(0, 2).map((task) => <p key={task.id} className={`calendar-event ${task.done ? "done" : ""}`}>{task.title}</p>)}
                    {dayTasks.length > 2 ? <p className="calendar-more">+{dayTasks.length - 2} {t.more}</p> : null}
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
