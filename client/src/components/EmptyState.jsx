export default function EmptyState({ title = 'Nothing here yet', description }) {
  return (
    <div className="text-center py-16">
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
    </div>
  );
}
