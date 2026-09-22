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
    <div className="relative w-full sm:max-w-xs">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={1.5}
        stroke="currentColor"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3.5 text-sm shadow-sm transition-all placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
      />
    </div>
  );
}
