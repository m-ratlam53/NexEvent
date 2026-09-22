import { useEffect, useState } from 'react';

export default function EventSearch({ value, onChange, placeholder = 'Search events…' }) {
  const [term, setTerm] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (term !== value) onChange(term);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  useEffect(() => {
    setTerm(value);
  }, [value]);

  return (
    <input
      type="search"
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 sm:max-w-xs"
    />
  );
}
