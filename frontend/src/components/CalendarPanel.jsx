import { WEEK_DAYS } from "../constants/i18n";
import { todayIso } from "../utils/date";

export default function CalendarPanel({ t, setActiveMonth, monthLabel, calendarDays, tasksByEndDate, lang }) {
  return (
    <section className="calendar-panel" aria-label={t.monthlyCalendar}>
      <header className="calendar-header">
        <button
          type="button"
          onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          aria-label={t.prevMonth}
        >
          &lt;
        </button>
        <h2>{monthLabel}</h2>
        <button
          type="button"
          onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
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
            <article key={day.iso} className={`calendar-cell ${day.inCurrentMonth ? "" : "muted"} ${isToday ? "today" : ""}`}>
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
  );
}

