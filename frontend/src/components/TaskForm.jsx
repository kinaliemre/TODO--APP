import { PRIORITY_OPTIONS, RECUR_OPTIONS } from "../constants/options";

export default function TaskForm({
  t,
  title,
  setTitle,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  priority,
  setPriority,
  recurring,
  setRecurring,
  tagsInput,
  setTagsInput,
  notes,
  setNotes,
  createTask,
  busyId,
  filter,
  setFilter,
  priorityLabel,
  recurringLabel,
}) {
  return (
    <section className="control-panel">
      <form className="create-form advanced" onSubmit={createTask}>
        <div className="field-wrap field-span-2">
          <label>{t.taskName}</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.taskName} />
        </div>

        <div className="field-wrap date-field">
          <label>{t.startDateLabel}</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="field-wrap date-field">
          <label>{t.endDateLabel}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="field-wrap">
          <label>{t.priority}</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {priorityLabel[item]}
              </option>
            ))}
          </select>
        </div>

        <div className="field-wrap">
          <label>{t.recurring}</label>
          <select value={recurring} onChange={(e) => setRecurring(e.target.value)}>
            {RECUR_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {recurringLabel[item]}
              </option>
            ))}
          </select>
        </div>

        <div className="field-wrap field-span-2">
          <label>{t.tags}</label>
          <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder={t.tags} />
        </div>

        <div className="field-wrap field-full">
          <label>{t.notes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notes} />
        </div>

        <button type="submit" disabled={busyId === "create"}>
          {busyId === "create" ? t.adding : t.addTask}
        </button>
      </form>

      <div className="filters">
        {[
          { key: "all", label: t.all },
          { key: "active", label: t.filterActive },
          { key: "done", label: t.filterDone },
        ].map((option) => (
          <button key={option.key} className={filter === option.key ? "active" : ""} onClick={() => setFilter(option.key)} type="button">
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
