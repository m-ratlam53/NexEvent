export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-500" />
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  );
}
