import { useEffect, useRef, useState } from 'react';
import { MapLibreMap, Marker, NavigationControl, config } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// maplibre-gl resolves its tile-parsing Web Worker relative to its own
// module URL at runtime — that breaks once the app is bundled into a single
// file (there's no sibling maplibre-gl-worker.mjs next to it any more), so
// the worker silently fails to load and tiles never render even though the
// map shell/controls/marker all initialize fine. Pointing WORKER_URL at a
// copy served from /public (see client/public/maplibre-gl-worker.mjs)
// fixes this in both dev and production builds.
config.WORKER_URL = '/maplibre-gl-worker.mjs';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : null;

function buildDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

async function reverseGeocode(lng, lat) {
  try {
    const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}`);
    const data = await res.json();
    return data.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/**
 * Single reusable venue map, per spec section 10. `mode="picker"` (used in
 * the organizer's Create/Edit form) adds a debounced MapTiler geocoding
 * search — the organizer clicks a search result, never types coordinates.
 * `mode="display"` (used on Event Details) just shows a marker at a fixed
 * location plus a Get Directions link. Degrades gracefully to an
 * address-only view when VITE_MAPTILER_API_KEY isn't configured, rather
 * than failing to render.
 */
export default function EventMap({ mode = 'display', value, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(
    value?.latitude != null && value?.longitude != null
      ? { address: value.address, latitude: value.latitude, longitude: value.longitude }
      : null,
  );

  useEffect(() => {
    if (mode !== 'picker' || !MAPTILER_KEY) return undefined;
    if (!query || query.trim().length < 3) {
      setResults([]);
      return undefined;
    }

    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=5`,
        );
        const data = await res.json();
        setResults(data.features || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [query, mode]);

  useEffect(() => {
    if (!STYLE_URL || !containerRef.current || mapRef.current) return undefined;

    const center = selected ? [selected.longitude, selected.latitude] : [0, 20];
    const zoom = selected ? 14 : 1.5;

    mapRef.current = new MapLibreMap({ container: containerRef.current, style: STYLE_URL, center, zoom });
    mapRef.current.addControl(new NavigationControl(), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !selected) return;
    const lngLat = [selected.longitude, selected.latitude];

    if (!markerRef.current) {
      markerRef.current = new Marker({ color: '#7c3aed', draggable: mode === 'picker' }).setLngLat(lngLat).addTo(mapRef.current);
      if (mode === 'picker') {
        markerRef.current.on('dragend', async () => {
          const { lng, lat } = markerRef.current.getLngLat();
          const address = await reverseGeocode(lng, lat);
          const location = { address, latitude: lat, longitude: lng };
          setSelected(location);
          setQuery(address);
          onChange?.(location);
        });
      }
    } else {
      markerRef.current.setLngLat(lngLat);
    }
    mapRef.current.flyTo({ center: lngLat, zoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Picker mode: clicking the map drops the pin at the exact spot clicked,
  // since geocoding search results are often approximate (e.g. street- or
  // area-level, not rooftop-accurate) and previously offered no way to
  // correct that.
  useEffect(() => {
    if (!mapRef.current || mode !== 'picker') return undefined;
    const map = mapRef.current;

    async function handleClick(e) {
      const { lng, lat } = e.lngLat;
      const address = await reverseGeocode(lng, lat);
      const location = { address, latitude: lat, longitude: lng };
      setSelected(location);
      setQuery(address);
      setResults([]);
      onChange?.(location);
    }

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleSelectResult(feature) {
    const [longitude, latitude] = feature.geometry.coordinates;
    const address = feature.place_name || feature.text;
    const location = { address, latitude, longitude };
    setSelected(location);
    setQuery(address);
    setResults([]);
    onChange?.(location);
  }

  const INPUT_CLASS =
    'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm transition-all placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15';

  if (!MAPTILER_KEY) {
    if (mode === 'picker') {
      return (
        <div className="space-y-2">
          <input
            value={value?.address || ''}
            onChange={(e) => onChange?.({ address: e.target.value, latitude: null, longitude: null })}
            placeholder="Venue address"
            className={INPUT_CLASS}
          />
          <p className="text-xs text-neutral-400">
            Map-based venue search is unavailable (no <code className="font-mono text-neutral-600">VITE_MAPTILER_API_KEY</code>{' '}
            configured) — plain text address for now.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 p-4 text-sm text-neutral-500">
        Map unavailable — set <code className="font-mono text-xs text-neutral-700">VITE_MAPTILER_API_KEY</code> to enable the venue
        map.
        {value?.address && <p className="mt-2 font-medium text-neutral-800">{value.address}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mode === 'picker' && (
        <div className="relative">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a venue or address…"
              className={`${INPUT_CLASS} pl-9`}
            />
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {searching && <p className="mt-1 text-xs text-brand-600">Searching venue…</p>}
          {results.length > 0 && (
            <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white/95 py-1 shadow-elevated backdrop-blur-md">
              {results.map((feature) => (
                <li key={feature.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(feature)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-neutral-800 transition-colors hover:bg-brand-50 hover:text-brand-900"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-brand-500">
                      <path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433 1.244-.77 3.13-2.17 4.63-4.352C17.5 11.72 18 9.28 18 7a8 8 0 10-16 0c0 2.28.5 4.72 2.001 7a14.28 14.28 0 005.67 4.933zM10 10a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">{feature.place_name || feature.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-2xl border border-neutral-200/80 shadow-sm" />

      {mode === 'picker' && selected && (
        <p className="text-xs text-neutral-400">Not quite right? Click the map or drag the pin to set the exact spot.</p>
      )}

      {mode === 'display' && selected && (
        <a
          href={buildDirectionsUrl(selected.latitude, selected.longitude)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-brand-500">
            <path
              fillRule="evenodd"
              d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433 1.244-.77 3.13-2.17 4.63-4.352C17.5 11.72 18 9.28 18 7a8 8 0 10-16 0c0 2.28.5 4.72 2.001 7a14.28 14.28 0 005.67 4.933zM10 10a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          Get Directions
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3 w-3 text-neutral-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.5l11-11m0 0h-7.5m7.5 0v7.5" />
          </svg>
        </a>
      )}
    </div>
  );
}
