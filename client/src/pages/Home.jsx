import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Welcome, {user?.name}</h1>
        <p className="text-neutral-500">Role: {user?.role}</p>
        <button
          onClick={logout}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
