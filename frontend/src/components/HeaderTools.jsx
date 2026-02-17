export default function HeaderTools({ theme, setTheme, lang, setLang, t }) {
  return (
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
        <button type="button" className={lang === "tr" ? "switch-btn active" : "switch-btn"} onClick={() => setLang("tr")}>
          TR
        </button>
        <button type="button" className={lang === "en" ? "switch-btn active" : "switch-btn"} onClick={() => setLang("en")}>
          EN
        </button>
      </div>
    </div>
  );
}

