import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventAnalytics } from '../../services/analytics.service';
import AnalyticsCard from '../../components/AnalyticsCard';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

export default function EventAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetchEventAnalytics(id)
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === 'loading') return <LoadingState label="Loading analytics…" />;
  if (status === 'error' || !analytics) return <ErrorState message="Couldn't load analytics." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/organizer/events" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to Dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-semibold text-neutral-900">{analytics.name} — Analytics</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <AnalyticsCard label="Registered" value={analytics.registeredCount} />
        <AnalyticsCard label="Waitlisted" value={analytics.waitlistedCount} />
        <AnalyticsCard label="Capacity" value={analytics.capacity} />
        <AnalyticsCard label="Available seats" value={analytics.availableSeats} />
        <AnalyticsCard label="Registration rate" value={`${analytics.registrationPercentage}%`} />
      </div>
    </div>
  );
}
