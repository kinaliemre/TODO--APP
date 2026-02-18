export default function ControlHub({
  t,
  activeTab,
  notifications,
  profileUsername,
  setProfileUsername,
  updateUsername,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  updatePassword,
  deleteAccount,
}) {
  const overdueCount = notifications.filter((item) => item.level === "overdue").length;
  const soonCount = notifications.filter((item) => item.level === "soon").length;

  if (!activeTab) return null;

  return (
    <section className="control-hub">
      <div className="hub-content">
        {activeTab === "notifications" ? (
          <div className="hub-panel notifications-panel-embedded">
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
              </div>
            </div>

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
          </div>
        ) : null}

        {activeTab === "profile" ? (
          <form className="hub-panel" onSubmit={updateUsername}>
            <h3>{t.profile}</h3>
            <input type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} placeholder={t.newUsername} />
            <button type="submit">{t.saveUsername}</button>
          </form>
        ) : null}

        {activeTab === "password" ? (
          <form className="hub-panel" onSubmit={updatePassword}>
            <h3>{t.passwordPanelTitle}</h3>
            <p>{t.passwordPanelDesc}</p>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t.currentPassword}
            />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t.newPassword} />
            <button type="submit">{t.savePassword}</button>
          </form>
        ) : null}

        {activeTab === "danger" ? (
          <div className="hub-panel danger-card">
            <h3>{t.deleteAccount}</h3>
            <button type="button" className="danger-btn" onClick={deleteAccount}>
              {t.deleteAccount}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
