export default function StatsGrid({ stats, t }) {
  return (
    <section className="stats-grid">
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
  );
}

