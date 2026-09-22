import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { FIELD_CLASS, LABEL_CLASS, BUTTON_PRIMARY } from '../utils/styles';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'participant' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const newUser = await signup(form);
      navigate(newUser.role === 'organizer' ? '/dashboard' : '/explore', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-mesh relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50 px-4 py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_40%,black_30%,transparent_100%)]" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="font-display mb-6 block text-center text-lg font-bold text-neutral-900">
          NexEvent
        </Link>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white/90 p-8 shadow-elevated-lg backdrop-blur"
        >
          <h1 className="font-display text-xl font-bold text-neutral-900">Create your NexEvent account</h1>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}
          <div>
            <label className={LABEL_CLASS}>Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Password</label>
            <PasswordInput
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={FIELD_CLASS}
            />
            <p className="mt-1 text-xs text-neutral-400">At least 8 characters, with letters and numbers.</p>
          </div>
          <div>
            <label className={LABEL_CLASS}>I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'participant', label: 'Participant', hint: 'Discover & attend' },
                { value: 'organizer', label: 'Organizer', hint: 'Host & publish' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: option.value })}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    form.role === option.value
                      ? 'border-brand-400 bg-brand-50 shadow-sm ring-1 ring-brand-400'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      form.role === option.value ? 'text-brand-700' : 'text-neutral-900'
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">{option.hint}</p>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} w-full`}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
          <p className="text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
