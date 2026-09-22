import { EVENT_CATEGORIES } from '../utils/constants';

const SORT_OPTIONS = [
  { value: 'date', label: 'Soonest' },
  { value: 'popularity', label: 'Most popular' },
  { value: 'name', label: 'Name (A–Z)' },
];

const SELECT_CLASS = 'rounded-md border border-neutral-300 px-3 py-2 text-sm';

export default function EventFilters({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const hasActiveFilters = filters.category || filters.date || filters.sort !== 'date';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={filters.category} onChange={(e) => update('category', e.target.value)} className={SELECT_CLASS}>
        <option value="">All categories</option>
        {EVENT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.date}
        onChange={(e) => update('date', e.target.value)}
        className={SELECT_CLASS}
      />

      <select value={filters.sort} onChange={(e) => update('sort', e.target.value)} className={SELECT_CLASS}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={() => onChange({ category: '', date: '', sort: 'date' })}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
