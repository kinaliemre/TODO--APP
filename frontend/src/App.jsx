import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import AuthView from "./components/AuthView";
import CalendarPanel from "./components/CalendarPanel";
import ControlHub from "./components/ControlHub";
import HeaderTools from "./components/HeaderTools";
import SearchPanel from "./components/SearchPanel";
import StatsGrid from "./components/StatsGrid";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { API_BASE, LOCALES, TRANSLATIONS } from "./constants/i18n";
import { apiRequest } from "./services/api";
import { buildCalendarDays, todayIso } from "./utils/date";
import { splitTagsInput, toErrorMessage } from "./utils/helpers";

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
  const [quickNoteTitle, setQuickNoteTitle] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [noteEntries, setNoteEntries] = useState(() => {
    try {
      const raw = localStorage.getItem("dailyNotes");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") {
        return Object.values(parsed).map((entry) => ({
          id: `legacy-${entry.dateKey}`,
          dateKey: entry.dateKey,
          dateLabel: entry.dateLabel,
          dayLabel: entry.dayLabel,
          title: entry.title || "",
          text: entry.text,
          createdAt: `${entry.dateKey}T00:00:00.000Z`,
        }));
      }
      return [];
    } catch {
      return [];
    }
  });
  const [selectedFiles, setSelectedFiles] = useState({});
  const [activeControlTab, setActiveControlTab] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [showNotesHistory, setShowNotesHistory] = useState(false);

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
  useEffect(() => (username ? localStorage.setItem("username", username) : localStorage.removeItem("username")), [username]);
  useEffect(() => localStorage.setItem("dailyNotes", JSON.stringify(noteEntries)), [noteEntries]);

  const logout = useCallback(() => {
    setToken("");
    setUsername("");
    setTasks([]);
    setNotifications([]);
    setError("");
    setSuccess("");
    setLoading(false);
  }, []);

  const request = useCallback(
    (path, options = {}, requiresAuth = true) =>
      apiRequest({ path, token, options, requiresAuth, onUnauthorized: logout }),
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

      const data = await request(`/tasks?${params.toString()}`);
      setTasks(data || []);
    } catch (err) {
      setError(toErrorMessage(err, "Request failed"));
    } finally {
      setLoading(false);
    }
  }, [token, filter, searchPriority, sortBy, searchQuery, searchTag, dueFrom, dueTo, request]);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      const data = await request("/notifications");
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    }
  }, [token, request]);

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

  const tasksByEndDate = useMemo(
    () =>
      tasks.reduce((acc, task) => {
        if (!task.end_date) return acc;
        if (!acc[task.end_date]) acc[task.end_date] = [];
        acc[task.end_date].push(task);
        return acc;
      }, {}),
    [tasks],
  );

  const calendarDays = useMemo(() => buildCalendarDays(activeMonth), [activeMonth]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(LOCALES[lang], { month: "long", year: "numeric" }).format(activeMonth),
    [activeMonth, lang],
  );

  const getTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayKey = getTodayKey();

  const todayMeta = useMemo(() => {
    const now = new Date();
    const dateLabel = new Intl.DateTimeFormat(LOCALES[lang], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(now);
    const rawDay = new Intl.DateTimeFormat(LOCALES[lang], { weekday: "long" }).format(now);
    const dayLabel = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
    return { dateLabel, dayLabel };
  }, [todayKey, lang]);

  const historyEntries = useMemo(
    () => [...noteEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [noteEntries],
  );

  const todayEntriesCount = useMemo(
    () => noteEntries.filter((entry) => entry.dateKey === todayKey).length,
    [noteEntries, todayKey],
  );

  const saveTodayNote = () => {
    const title = quickNoteTitle.trim();
    const text = quickNote.trim();
    if (!text) return;

    setNoteEntries((prev) => [
      ...prev,
      {
        id: `${todayKey}-${Date.now()}`,
        dateKey: todayKey,
        dateLabel: todayMeta.dateLabel,
        dayLabel: todayMeta.dayLabel,
        title,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setQuickNoteTitle("");
    setQuickNote("");
  };

  const deleteNoteEntry = (entryId) => {
    setNoteEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

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
      const data = await request(
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
      const data = await request("/profile", {
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
      const data = await request("/profile/password", {
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
      await request("/profile", { method: "DELETE" });
      logout();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    }
  };

  const toggleControlTab = (tab) => {
    setActiveControlTab((prev) => (prev === tab ? null : tab));
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      setBusyId("create");
      setError("");
      await request("/tasks", {
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
      await request(`/tasks/${taskId}`, {
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
      await request(`/tasks/${taskId}`, { method: "DELETE" });
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
      await request(`/tasks/${taskId}/attachments`, { method: "POST", body: form });
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
      await request(`/attachments/${attachmentId}`, { method: "DELETE" });
      await fetchTasks();
    } catch (err) {
      setError(toErrorMessage(err, t.error));
    }
  };

  const downloadAttachment = async (attachment) => {
    try {
      const response = await fetch(`${API_BASE}/attachments/${attachment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
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

  if (!token) {
    return (
      <AuthView
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={t}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authUsername={authUsername}
        setAuthUsername={setAuthUsername}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authBusy={authBusy}
        submitAuth={submitAuth}
        authError={authError}
      />
    );
  }

  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />
      <main className="board">
        <HeaderTools theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />

        <header className="board-header">
          <div className="session-actions">
            <span>
              {t.loggedInAs}: <strong>{username}</strong>
            </span>
            <button type="button" className="logout-btn" onClick={logout}>
              {t.logout}
            </button>
          </div>
          <div className="title-layout">
            <div
              className={activeView === "notes" ? "title-main title-main-clickable" : "title-main"}
              role={activeView === "notes" ? "button" : undefined}
              tabIndex={activeView === "notes" ? 0 : undefined}
              onClick={activeView === "notes" ? () => setActiveView("dashboard") : undefined}
              onKeyDown={
                activeView === "notes"
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveView("dashboard");
                      }
                    }
                  : undefined
              }
            >
              <h1>{t.title}</h1>
              <p className="subtitle">{t.subtitle}</p>
            </div>
            <button type="button" className="title-notes-card" onClick={() => setActiveView("notes")}>
              <h2>{t.notesPageTitle}</h2>
              <p>{t.notesCardDesc}</p>
            </button>
          </div>
        </header>
        {activeView === "notes" ? (
          <section className="notes-page" aria-label={t.notesPageTitle}>
            <div className="notes-page-head">
              <h2>{t.notesPageTitle}</h2>
              <div className="notes-page-head-actions">
                <button type="button" className="session-tab-btn" onClick={() => setActiveView("dashboard")}>
                  {t.backToTaskCenter}
                </button>
                <button
                  type="button"
                  className={showNotesHistory ? "session-tab-btn active" : "session-tab-btn"}
                  onClick={() => setShowNotesHistory((prev) => !prev)}
                >
                  {t.notesHistory}
                </button>
                <button type="button" className="session-tab-btn active" onClick={saveTodayNote}>
                  {t.addTodayNote}
                </button>
              </div>
            </div>
            {showNotesHistory ? (
              <section className="notes-history" aria-label={t.notesHistory}>
                <h3>{t.notesHistory}</h3>
                <div className="notes-timeline">
                  {historyEntries.length === 0 ? (
                    <p className="empty-state">{t.noSavedNotes}</p>
                  ) : (
                    historyEntries.map((entry) => (
                      <article key={entry.id} className="note-item">
                        <div className="note-item-head">
                          <div className="note-item-meta">
                            <strong>{entry.dateLabel}</strong>
                            <span>{entry.dayLabel}</span>
                          </div>
                          <button
                            type="button"
                            className="note-delete-btn"
                            onClick={() => deleteNoteEntry(entry.id)}
                            aria-label={`${entry.dateLabel} ${t.deleteNoteAria}`}
                            title={t.delete}
                          >
                            🗑
                          </button>
                        </div>
                        {entry.title ? <p className="note-item-title">{entry.title}</p> : null}
                        <p className="note-item-text">{entry.text}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ) : null}
            <p className="notes-today">
              {t.todayNotesLabel} - {todayMeta.dateLabel} - {todayMeta.dayLabel} ({todayEntriesCount} {t.recordsCount})
            </p>
            <input
              type="text"
              className="notes-title-input"
              value={quickNoteTitle}
              onChange={(event) => setQuickNoteTitle(event.target.value)}
              placeholder={t.optionalTitle}
            />
            <textarea
              className="notes-page-editor"
              value={quickNote}
              onChange={(event) => setQuickNote(event.target.value)}
              placeholder={t.todayNotePlaceholder}
            />
          </section>
        ) : (
          <>
            <StatsGrid stats={stats} t={t} />

            <div className="session-controls-row">
              <div className="session-controls">
                <button
                  type="button"
                  className={activeControlTab === "notifications" ? "session-tab-btn active" : "session-tab-btn"}
                  onClick={() => toggleControlTab("notifications")}
                >
                  {t.notifications}
                </button>
                <button
                  type="button"
                  className={activeControlTab === "profile" ? "session-tab-btn active" : "session-tab-btn"}
                  onClick={() => toggleControlTab("profile")}
                >
                  {t.profile}
                </button>
                <button
                  type="button"
                  className={activeControlTab === "password" ? "session-tab-btn active" : "session-tab-btn"}
                  onClick={() => toggleControlTab("password")}
                >
                  {t.password}
                </button>
                <button
                  type="button"
                  className={activeControlTab === "danger" ? "session-tab-btn active danger" : "session-tab-btn danger"}
                  onClick={() => toggleControlTab("danger")}
                >
                  {t.deleteAccount}
                </button>
                <button
                  type="button"
                  className={activeControlTab === "search" ? "session-tab-btn active" : "session-tab-btn"}
                  onClick={() => toggleControlTab("search")}
                >
                  {t.searchFieldLabel}
                </button>
                <button
                  type="button"
                  className={activeControlTab === "task" ? "session-tab-btn active" : "session-tab-btn"}
                  onClick={() => toggleControlTab("task")}
                >
                  {t.addTask}
                </button>
              </div>
            </div>

            {["notifications", "profile", "password", "danger"].includes(activeControlTab) ? (
              <ControlHub
                t={t}
                activeTab={activeControlTab}
                notifications={notifications}
                profileUsername={profileUsername}
                setProfileUsername={setProfileUsername}
                updateUsername={updateUsername}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                updatePassword={updatePassword}
                deleteAccount={deleteAccount}
              />
            ) : null}

            {activeControlTab === "search" ? (
              <SearchPanel
                className="control-hub search-panel embedded-search-panel"
                t={t}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchTag={searchTag}
                setSearchTag={setSearchTag}
                searchPriority={searchPriority}
                setSearchPriority={setSearchPriority}
                dueFrom={dueFrom}
                setDueFrom={setDueFrom}
                dueTo={dueTo}
                setDueTo={setDueTo}
                sortBy={sortBy}
                setSortBy={setSortBy}
                priorityLabel={priorityLabel}
              />
            ) : null}

            {activeControlTab === "task" ? (
              <TaskForm
                className="control-panel control-hub embedded-task-panel"
                t={t}
                title={title}
                setTitle={setTitle}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                priority={priority}
                setPriority={setPriority}
                recurring={recurring}
                setRecurring={setRecurring}
                tagsInput={tagsInput}
                setTagsInput={setTagsInput}
                notes={notes}
                setNotes={setNotes}
                createTask={createTask}
                busyId={busyId}
                filter={filter}
                setFilter={setFilter}
                priorityLabel={priorityLabel}
                recurringLabel={recurringLabel}
              />
            ) : null}

            {error ? (
              <p className="error-banner">
                {t.error}: {error}
              </p>
            ) : null}
            {success ? <p className="success-banner">{success}</p> : null}

            <TaskList
              t={t}
              tasks={tasks}
              loading={loading}
              busyId={busyId}
              updateTaskState={updateTaskState}
              deleteTask={deleteTask}
              priorityLabel={priorityLabel}
              recurringLabel={recurringLabel}
              setSelectedFiles={setSelectedFiles}
              selectedFiles={selectedFiles}
              uploadAttachment={uploadAttachment}
              uploadingTaskId={uploadingTaskId}
              downloadAttachment={downloadAttachment}
              removeAttachment={removeAttachment}
            />

            <CalendarPanel
              t={t}
              setActiveMonth={setActiveMonth}
              monthLabel={monthLabel}
              calendarDays={calendarDays}
              tasksByEndDate={tasksByEndDate}
              lang={lang}
            />
          </>
        )}
      </main>
    </div>
  );
}

