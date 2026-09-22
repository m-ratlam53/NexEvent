import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchEventAnalytics } from '../../services/analytics.service';
import { useTheme } from '../../context/ThemeContext';
import { getChartPalette } from '../../utils/chartColors';
import AnalyticsCard from '../../components/AnalyticsCard';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import PageFade, { RevealGroup, RevealItem } from '../../components/motion/Reveal';

export default function EventAnalytics() {
  const { id } = useParams();
  const { isDark } = useTheme();
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

  const palette = getChartPalette(isDark);

  const capacityBreakdown = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Registered', value: analytics.registeredCount, color: palette.brand },
      { name: 'Waitlisted', value: analytics.waitlistedCount, color: palette.amber },
      { name: 'Remaining', value: analytics.availableSeats, color: palette.neutral },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics, isDark]);

  if (status === 'loading') return <LoadingState label="Loading analytics…" />;
  if (status === 'error' || !analytics) return <ErrorState message="Couldn't load analytics." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        ← Back to Dashboard
      </Link>
      <PageFade delay={0.05}>
        <h1 className="font-display mb-6 mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{analytics.name}</h1>
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

      <PageFade
        delay={0.1}
        className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Capacity breakdown
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={capacityBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={capacityBreakdown.some((d) => d.value > 0) ? 2 : 0}
              >
                {capacityBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12 }}
                labelStyle={{ color: palette.tooltipText }}
                itemStyle={{ color: palette.tooltipText }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: palette.axis }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </PageFade>
    </div>
  );
}
