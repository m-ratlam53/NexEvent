import { useState } from 'react';
import { EVENT_CATEGORIES } from '../../utils/constants';
import EventMap from '../../components/EventMap';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: EVENT_CATEGORIES[0],
  date: '',
  startTime: '',
  endTime: '',
  mode: 'onsite',
  location: { address: '' },
  capacity: 20,
};

const FIELD_CLASS =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900';

export default function EventForm({ initialValues, onSubmit, submitLabel = 'Save' }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.mode === 'onsite' && !form.location?.address) {
      setError('Search for a venue and select a result before saving.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Event name</label>
        <input
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} className={FIELD_CLASS}>
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Mode</label>
          <select value={form.mode} onChange={(e) => update('mode', e.target.value)} className={FIELD_CLASS}>
            <option value="onsite">Onsite</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Start time</label>
          <input
            type="time"
            required
            value={form.startTime}
            onChange={(e) => update('startTime', e.target.value)}
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">End time</label>
          <input
            type="time"
            required
            value={form.endTime}
            onChange={(e) => update('endTime', e.target.value)}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      {form.mode === 'onsite' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Venue</label>
          <EventMap mode="picker" value={form.location} onChange={(location) => update('location', location)} />
          {!form.location?.address && (
            <p className="mt-1 text-xs text-neutral-400">Search for a venue above and select a result.</p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Capacity</label>
        <input
          type="number"
          min={1}
          required
          value={form.capacity}
          onChange={(e) => update('capacity', Number(e.target.value))}
          className="w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
