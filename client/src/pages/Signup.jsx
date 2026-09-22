import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      await signup(form);
      navigate('/explore', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-8 rounded-xl shadow-sm border border-neutral-200"
      >
        <h1 className="text-xl font-semibold text-neutral-900">Create your NexEvent account</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <p className="text-xs text-neutral-400 mt-1">At least 8 characters, with letters and numbers.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">I am a</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="participant">Participant</option>
            <option value="organizer">Organizer</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-sm text-neutral-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-neutral-900 underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
