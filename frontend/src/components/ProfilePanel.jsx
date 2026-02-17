import { useState } from "react";

export default function ProfilePanel({
  t,
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
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <section className="profile-hub">
      <div className="panel-tabs">
        <button type="button" className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
          {t.profile}
        </button>
        <button type="button" className={activeTab === "password" ? "active" : ""} onClick={() => setActiveTab("password")}>
          {t.password}
        </button>
        <button type="button" className={activeTab === "danger" ? "active" : ""} onClick={() => setActiveTab("danger")}>
          {t.deleteAccount}
        </button>
      </div>

      {activeTab === "profile" ? (
        <form className="profile-card single-card" onSubmit={updateUsername}>
          <h3>{t.profile}</h3>
          <input type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} placeholder={t.newUsername} />
          <button type="submit">{t.saveUsername}</button>
        </form>
      ) : null}

      {activeTab === "password" ? (
        <form className="profile-card single-card" onSubmit={updatePassword}>
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
        <div className="profile-card single-card danger-card">
          <h3>{t.deleteAccount}</h3>
          <button type="button" className="danger-btn" onClick={deleteAccount}>
            {t.deleteAccount}
          </button>
        </div>
      ) : null}
    </section>
  );
}
