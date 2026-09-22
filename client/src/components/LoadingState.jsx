export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-500 dark:border-neutral-700 dark:border-t-brand-400" />
      <p className="text-sm text-neutral-400 dark:text-neutral-500">{label}</p>
    </div>
  );
}
