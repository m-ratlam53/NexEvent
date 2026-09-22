import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { FIELD_CLASS, LABEL_CLASS, BUTTON_PRIMARY } from '../utils/styles';

// `location.state.from` (set by ProtectedRoute when redirecting an
// unauthenticated visit to /login) is only honored when it's reachable by
// the role that just logged in — otherwise it can carry over a stale
// organizer-only path (e.g. left over from a previous session in the same
// tab) and bounce a participant somewhere they don't belong instead of
// their own role home.
function resolveLoginRedirect(fromPathname, role) {
  const roleHome = role === 'organizer' ? '/dashboard' : '/explore';
  const isOrganizerOnlyPath = fromPathname === '/dashboard' || fromPathname?.startsWith('/organizer/');
  if (!fromPathname || (isOrganizerOnlyPath && role !== 'organizer')) return roleHome;
  return fromPathname;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      const redirectTo = resolveLoginRedirect(location.state?.from?.pathname, loggedInUser.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-mesh relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50 px-4">
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
          <h1 className="font-display text-xl font-bold text-neutral-900">Log in to NexEvent</h1>
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
          </div>
          <button type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} w-full`}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-center text-sm text-neutral-500">
            No account?{' '}
            <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">
              Sign up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
