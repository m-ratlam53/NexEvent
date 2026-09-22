import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchOrganizerAnalytics } from '../../services/analytics.service';
import { useTheme } from '../../context/ThemeContext';
import { getChartPalette } from '../../utils/chartColors';
import AnalyticsCard from '../../components/AnalyticsCard';
import EventStatus from '../../components/EventStatus';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import PageFade, { RevealGroup, RevealItem } from '../../components/motion/Reveal';

// Classifies each event into exactly the 4 buckets asked for
// (published/draft/cancelled/completed) from fields the API already
// returns — status is the stored value, "Completed" is the derived
// displayStatus — no new backend computation.
function statusBucket(event) {
  if (event.status === 'draft') return 'Draft';
  if (event.status === 'cancelled') return 'Cancelled';
  if (event.displayStatus === 'Completed') return 'Completed';
  return 'Published';
}

function truncateName(name, max = 16) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">{title}</p>
      {children}
    </div>
  );
}

// Reuses the same organizer-wide rollup Dashboard's stat strip is built
// from, plus the per-event breakdown that endpoint already returns — no
// new backend logic, just a dedicated page for the sidebar's Analytics
// item with an "All Events" (aggregate) tab and a "By Event" tab to pick
// one and jump to its detailed analytics.
export default function Analytics() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    let cancelled = false;
    fetchOrganizerAnalytics()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const palette = getChartPalette(isDark);

  const registrationsPerEvent = useMemo(
    () =>
      (stats?.events || []).map((e) => ({
        name: truncateName(e.name),
        fullName: e.name,
        registered: e.registeredCount,
      })),
    [stats],
  );

  const statusDistribution = useMemo(() => {
    if (!stats) return [];
    const counts = { Published: 0, Draft: 0, Cancelled: 0, Completed: 0 };
    stats.events.forEach((e) => {
      counts[statusBucket(e)] += 1;
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value, color: palette.status[name] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, isDark]);

  const waitlistEvents = useMemo(
    () =>
      (stats?.events || [])
        .filter((e) => e.waitlistedCount > 0)
        .map((e) => ({
          name: truncateName(e.name),
          fullName: e.name,
          registered: e.registeredCount,
          waitlisted: e.waitlistedCount,
        })),
    [stats],
  );

  const tooltipStyle = {
    contentStyle: { background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, fontSize: 12 },
    labelStyle: { color: palette.tooltipText },
    itemStyle: { color: palette.tooltipText },
  };
  const axisTick = { fontSize: 11, fill: palette.axis };

  if (status === 'loading') return <LoadingState label="Loading analytics…" />;
  if (status === 'error' || !stats) return <ErrorState message="Couldn't load analytics." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageFade>
        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Registration performance across your events.</p>
      </PageFade>

      {stats.events.length > 0 && (
        <div className="my-6 flex w-fit gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'byEvent', label: 'By Event' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {stats.events.length === 0 ? (
        <EmptyState title="No events yet" description="Create your first event to see registration analytics here." />
      ) : tab === 'all' ? (
        <>
          <RevealGroup className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" stagger={0.05}>
            <RevealItem>
              <AnalyticsCard label="Total events" value={stats.totalEvents} />
            </RevealItem>
            <RevealItem>
              <AnalyticsCard label="Upcoming events" value={stats.upcomingEventsCount} />
            </RevealItem>
            <RevealItem>
              <AnalyticsCard label="Total registrations" value={stats.totalRegistrations} />
            </RevealItem>
            <RevealItem>
              <AnalyticsCard label="Waitlisted" value={stats.totalWaitlisted} />
            </RevealItem>
            <RevealItem>
              <AnalyticsCard label="Available seats" value={stats.availableSeats} />
            </RevealItem>
            <RevealItem>
              <AnalyticsCard label="Registration rate" value={`${stats.registrationPercentage}%`} />
            </RevealItem>
          </RevealGroup>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Registrations per event">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationsPerEvent} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={palette.grid} vertical={false} />
                    <XAxis dataKey="name" tick={axisTick} interval={0} angle={-25} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={axisTick} />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value) => [value, 'Registered']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                    />
                    <Bar dataKey="registered" fill={palette.brand} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Events by status">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2}>
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: palette.axis }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Registered vs waitlisted (events with a waitlist)" className="mt-4">
            {waitlistEvents.length === 0 ? (
              <EmptyState title="No events currently have a waitlist" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waitlistEvents} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={palette.grid} vertical={false} />
                    <XAxis dataKey="name" tick={axisTick} interval={0} angle={-25} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={axisTick} />
                    <Tooltip {...tooltipStyle} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''} />
                    <Legend wrapperStyle={{ fontSize: 12, color: palette.axis }} />
                    <Bar dataKey="registered" stackId="a" fill={palette.brand} name="Registered" />
                    <Bar dataKey="waitlisted" stackId="a" fill={palette.amber} radius={[6, 6, 0, 0]} name="Waitlisted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </>
      ) : (
        <RevealGroup className="space-y-2.5" stagger={0.04}>
          {stats.events.map((event) => (
            <RevealItem key={event.eventId}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-elevated dark:border-neutral-800 dark:bg-neutral-900">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{event.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {event.registeredCount}/{event.capacity} registered
                    {event.waitlistedCount > 0 && ` · ${event.waitlistedCount} waitlisted`} ·{' '}
                    {event.availableSeats} seats available
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <EventStatus status={event.displayStatus} />
                  <Link
                    to={`/organizer/events/${event.eventId}/analytics`}
                    className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
