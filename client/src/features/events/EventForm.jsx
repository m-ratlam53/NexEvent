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
  registrationDeadline: '',
  posterUrl: '',
};

const FIELD_CLASS =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900';

const MAX_POSTER_BYTES = 5 * 1024 * 1024;

export default function EventForm({ initialValues, onSubmit, submitLabel = 'Save' }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePosterChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Poster must be an image file.');
      return;
    }
    if (file.size > MAX_POSTER_BYTES) {
      setError('Poster image must be smaller than 5MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => update('posterUrl', reader.result);
    reader.readAsDataURL(file);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Capacity</label>
          <input
            type="number"
            min={1}
            required
            value={form.capacity}
            onChange={(e) => update('capacity', Number(e.target.value))}
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Registration deadline (optional)</label>
          <input
            type="datetime-local"
            value={form.registrationDeadline || ''}
            onChange={(e) => update('registrationDeadline', e.target.value)}
            className={FIELD_CLASS}
          />
          <p className="mt-1 text-xs text-neutral-400">Must be before the event starts. Leave blank for no cutoff.</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Event poster (optional)</label>
        {form.posterUrl ? (
          <div>
            <img
              src={form.posterUrl}
              alt="Poster preview"
              className="h-40 w-full max-w-sm rounded-md border border-neutral-200 object-cover"
            />
            <button
              type="button"
              onClick={() => update('posterUrl', '')}
              className="mt-2 text-xs font-medium text-red-600 hover:underline"
            >
              Remove poster
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={handlePosterChange}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
          />
        )}
        <p className="mt-1 text-xs text-neutral-400">Shown to participants on the event details page. Max 5MB.</p>
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
