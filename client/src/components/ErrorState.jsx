export default function ErrorState({ message = 'Something went wrong.' }) {
  return (
    <div className="text-center py-16">
      <p className="text-sm font-medium text-red-600">{message}</p>
    </div>
  );
}
