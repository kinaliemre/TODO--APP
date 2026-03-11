import HeaderTools from "./HeaderTools";

export default function AuthView({
  theme,
  setTheme,
  lang,
  setLang,
  t,
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authBusy,
  submitAuth,
  forgotOpen,
  setForgotOpen,
  forgotUsername,
  setForgotUsername,
  forgotNewPassword,
  setForgotNewPassword,
  forgotNewPasswordRepeat,
  setForgotNewPasswordRepeat,
  forgotBusy,
  submitForgotPassword,
  authSuccess,
  authError,
}) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />
      <main className="board auth-board">
        <HeaderTools theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />

        <header className="board-header">
          <img className="brand-logo" src="/TO-DO.png" alt="TO-DO logo" />
          <h1>{t.title}</h1>
          <p className="subtitle">{t.authSubtitle}</p>
        </header>

        <section className="auth-card">
          <div className="auth-tabs">
            <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
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
            <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder={t.username} />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder={t.password}
            />
            <button type="submit" disabled={authBusy}>
              {authBusy ? t.authLoading : authMode === "login" ? t.submitLogin : t.submitRegister}
            </button>
            {authMode === "login" ? (
              <button type="button" className="forgot-link-btn" onClick={() => setForgotOpen((prev) => !prev)}>
                {t.forgotPassword}
              </button>
            ) : null}
          </form>
          {authMode === "login" && forgotOpen ? (
            <div className="forgot-panel">
              <p>{t.forgotPasswordDesc}</p>
              <input type="text" value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} placeholder={t.username} />
              <input
                type="password"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                placeholder={t.newPassword}
              />
              <input
                type="password"
                value={forgotNewPasswordRepeat}
                onChange={(e) => setForgotNewPasswordRepeat(e.target.value)}
                placeholder={t.newPasswordRepeat}
              />
              <button type="button" onClick={submitForgotPassword} disabled={forgotBusy}>
                {forgotBusy ? t.authLoading : t.resetPassword}
              </button>
            </div>
          ) : null}
          {authSuccess ? <p className="success-banner">{authSuccess}</p> : null}

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

