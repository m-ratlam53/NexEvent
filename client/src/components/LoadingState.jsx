export default function LoadingState({ label = 'Loading…' }) {
  return <div className="flex items-center justify-center py-16 text-sm text-neutral-400">{label}</div>;
}
