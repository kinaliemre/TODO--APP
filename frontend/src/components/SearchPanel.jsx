import { PRIORITY_OPTIONS } from "../constants/options";

export default function SearchPanel({
  t,
  searchQuery,
  setSearchQuery,
  searchTag,
  setSearchTag,
  searchPriority,
  setSearchPriority,
  dueFrom,
  setDueFrom,
  dueTo,
  setDueTo,
  sortBy,
  setSortBy,
  priorityLabel,
}) {
  return (
    <section className="search-panel">
      <div className="field-wrap search-field-wide">
        <label>{t.searchFieldLabel}</label>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} />
      </div>

      <div className="field-wrap search-field-wide">
        <label>{t.tagFilterLabel}</label>
        <input value={searchTag} onChange={(e) => setSearchTag(e.target.value)} placeholder={t.tagFilter} />
      </div>

      <div className="field-wrap">
        <label>{t.priorityFilterLabel}</label>
        <select value={searchPriority} onChange={(e) => setSearchPriority(e.target.value)}>
          <option value="all">{t.all}</option>
          {PRIORITY_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {priorityLabel[item]}
            </option>
          ))}
        </select>
      </div>

      <div className="field-wrap">
        <label>{t.dueFromLabel}</label>
        <input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
      </div>

      <div className="field-wrap">
        <label>{t.dueToLabel}</label>
        <input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
      </div>

      <div className="field-wrap">
        <label>{t.sortLabel}</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_desc">{t.sortCreatedDesc}</option>
          <option value="created_asc">{t.sortCreatedAsc}</option>
          <option value="due_asc">{t.sortDueAsc}</option>
          <option value="due_desc">{t.sortDueDesc}</option>
        </select>
      </div>
    </section>
  );
}
