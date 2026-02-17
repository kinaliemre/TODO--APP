import { useState } from "react";

export default function NotificationPanel({ notifications, t }) {
  const [open, setOpen] = useState(true);
  const overdueCount = notifications.filter((item) => item.level === "overdue").length;
  const soonCount = notifications.filter((item) => item.level === "soon").length;

  return (
    <section className="notification-hub">
      <div className="panel-head">
        <div>
          <h3>{t.notifications}</h3>
          <p>{t.notificationsDesc}</p>
        </div>
        <div className="notice-counts">
          <span className="count-pill overdue">
            {t.overdue}: {overdueCount}
          </span>
          <span className="count-pill soon">
            {t.dueSoon}: {soonCount}
          </span>
          <button type="button" className="panel-toggle-btn" onClick={() => setOpen((prev) => !prev)}>
            {open ? t.hidePanel : t.showPanel}
          </button>
        </div>
      </div>

      {open ? (
        <div className="notice-list">
          {notifications.length === 0 ? <p className="empty-state inline-empty">{t.noNotifications}</p> : null}
          {notifications.map((item) => (
            <article key={`${item.task_id}-${item.level}`} className={`notice-card ${item.level}`}>
              <strong>{item.level === "overdue" ? t.overdue : t.dueSoon}</strong>
              <span>{item.title}</span>
              <small>{item.due_date}</small>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
