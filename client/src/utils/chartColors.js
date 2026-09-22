// Recharts needs literal color strings (SVG fill/stroke) which can't
// respond to Tailwind's `dark:` class variant on their own — this derives
// the same brand/neutral palette already used elsewhere into hex values
// per theme, so charts stay legible and on-brand in both modes rather than
// hardcoding one look.
export function getChartPalette(isDark) {
  return {
    brand: isDark ? '#a78bfa' : '#7c3aed', // brand-400 / brand-600
    brandMuted: isDark ? '#c4b5fd' : '#a78bfa', // brand-300 / brand-400
    amber: isDark ? '#fbbf24' : '#f59e0b',
    red: isDark ? '#f87171' : '#ef4444',
    neutral: isDark ? '#3f3f46' : '#e4e4e7', // "remaining capacity" track
    grid: isDark ? '#27272a' : '#f4f4f5',
    axis: isDark ? '#a1a1aa' : '#71717a',
    tooltipBg: isDark ? '#18181b' : '#ffffff',
    tooltipBorder: isDark ? '#3f3f46' : '#e4e4e7',
    tooltipText: isDark ? '#f4f4f5' : '#18181b',
    // For the events-by-status distribution chart.
    status: {
      Published: isDark ? '#a78bfa' : '#7c3aed',
      Draft: isDark ? '#71717a' : '#a1a1aa',
      Cancelled: isDark ? '#f87171' : '#ef4444',
      Completed: isDark ? '#52525b' : '#d4d4d8',
    },
  };
}
