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
  authError,
}) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />
      <main className="board auth-board">
        <HeaderTools theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />

        <header className="board-header">
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

