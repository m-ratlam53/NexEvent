import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventAnalytics } from '../../services/analytics.service';
import AnalyticsCard from '../../components/AnalyticsCard';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import PageFade, { RevealGroup, RevealItem } from '../../components/motion/Reveal';

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
      <Link
        to="/organizer/events"
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← Back to Dashboard
      </Link>
      <PageFade delay={0.05}>
        <h1 className="font-display mb-6 mt-3 text-2xl font-bold text-neutral-900">{analytics.name}</h1>
      </PageFade>

      <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-5" stagger={0.05}>
        <RevealItem>
          <AnalyticsCard label="Registered" value={analytics.registeredCount} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Waitlisted" value={analytics.waitlistedCount} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Capacity" value={analytics.capacity} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Available seats" value={analytics.availableSeats} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Registration rate" value={`${analytics.registrationPercentage}%`} />
        </RevealItem>
      </RevealGroup>
    </div>
  );
}
