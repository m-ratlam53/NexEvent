import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_CATEGORIES } from '../../utils/constants';
import EventMap from '../../components/EventMap';
import { FIELD_CLASS, LABEL_CLASS, BUTTON_PRIMARY } from '../../utils/styles';

function StepHeading({ step, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-xs font-bold text-white">
        {step}
      </span>
      <h2 className="font-display text-base font-semibold text-neutral-900">{title}</h2>
    </div>
  );
}

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-red-500">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic Details Section */}
      <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <StepHeading step={1} title="Event Overview" />

        <div>
          <label className={LABEL_CLASS}>Event Name *</label>
          <input
            required
            placeholder="e.g., AI Founders Meetup 2026"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            rows={3}
            placeholder="Describe what attendees can expect, schedule highlights, speaker info..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Category *</label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className={FIELD_CLASS}
            >
              {EVENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Format / Mode *</label>
            <div className="flex rounded-xl bg-neutral-100 p-1">
              <button
                type="button"
                onClick={() => update('mode', 'onsite')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  form.mode === 'onsite'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand-500">
                  <path
                    fillRule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433 1.244-.77 3.13-2.17 4.63-4.352C17.5 11.72 18 9.28 18 7a8 8 0 10-16 0c0 2.28.5 4.72 2.001 7a14.28 14.28 0 005.67 4.933zM10 10a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Onsite
              </button>
              <button
                type="button"
                onClick={() => update('mode', 'online')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  form.mode === 'online'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand-500">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 7.027A7.014 7.014 0 019 4.07v2.04c0 .518.232 1.01.634 1.34l.09.075c.28.233.44.577.44.94 0 .318-.124.624-.347.852l-.658.672a1.375 1.375 0 00-.404.972v.328c0 .364-.145.714-.402.971l-.47.47a1.375 1.375 0 01-.972.403h-.624a.75.75 0 01-.75-.75v-.435a2.25 2.25 0 00-.659-1.591l-.22-.22A6.974 6.974 0 014.332 7.027zm10.748 5.485A6.97 6.97 0 0110 17.93v-1.18c0-.365-.145-.714-.403-.972l-.12-.12a1.375 1.375 0 00-.972-.403h-1.25a.75.75 0 01-.75-.75v-.865c0-.364-.144-.713-.402-.971l-.145-.145a.75.75 0 01-.22-.53v-.218c0-.76.616-1.375 1.375-1.375h1.125a.75.75 0 01.75.75v.25c0 .364.145.714.403.972l.47.47a1.375 1.375 0 00.972.403h1.365a.75.75 0 01.693.466l.332.796a.75.75 0 01-.06.757l-.372.497a.75.75 0 00-.15.45v.393c0 .17.06.333.169.462l.278.332c.16.191.246.435.246.687v.068z"
                    clipRule="evenodd"
                  />
                </svg>
                Online
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Time Section */}
      <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <StepHeading step={2} title="Date & Schedule" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL_CLASS}>Date *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Start Time *</label>
            <input
              type="time"
              required
              value={form.startTime}
              onChange={(e) => update('startTime', e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>End Time *</label>
            <input
              type="time"
              required
              value={form.endTime}
              onChange={(e) => update('endTime', e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>
      </div>

      {/* Location / Venue Section */}
      <AnimatePresence>
        {form.mode === 'onsite' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6"
          >
            <div>
              <StepHeading step={3} title="Venue Location" />
              <p className="mt-0.5 pl-[34px] text-xs text-neutral-500">
                Search and select the venue. A map marker will be shown to attendees.
              </p>
            </div>
            <EventMap mode="picker" value={form.location} onChange={(location) => update('location', location)} />
            {!form.location?.address && (
              <p className="text-xs text-amber-600">Please select an address from the search results.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capacity & Deadline Section */}
      <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <StepHeading step={4} title="Capacity & Registration Cutoff" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Maximum Attendees *</label>
            <input
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={(e) => update('capacity', Number(e.target.value))}
              className={FIELD_CLASS}
            />
            <p className="mt-1 text-xs text-neutral-400">Total spots available before waitlist activates.</p>
          </div>

          <div>
            <label className={LABEL_CLASS}>Registration Deadline (optional)</label>
            <input
              type="datetime-local"
              value={form.registrationDeadline || ''}
              onChange={(e) => update('registrationDeadline', e.target.value)}
              className={FIELD_CLASS}
            />
            <p className="mt-1 text-xs text-neutral-400">Cutoff time before the event starts. Leave blank for no cutoff.</p>
          </div>
        </div>
      </div>

      {/* Poster Upload Section */}
      <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <StepHeading step={5} title="Event Poster" />

        {form.posterUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-2 sm:p-3">
            <img
              src={form.posterUrl}
              alt="Poster preview"
              className="max-h-60 w-full rounded-xl object-cover"
            />
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-neutral-500">Poster attached</span>
              <button
                type="button"
                onClick={() => update('posterUrl', '')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-all hover:bg-red-50"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                Remove Poster
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/60 p-8 text-center transition-all hover:border-brand-300 hover:bg-brand-50/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-neutral-900">Click to upload poster image</p>
            <p className="mt-1 text-xs text-neutral-400">PNG, JPG or WebP up to 5MB</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePosterChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="submit" disabled={submitting} className={BUTTON_PRIMARY}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving…
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
