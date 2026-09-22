import { useEffect, useRef, useState } from 'react';
import { MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : null;

function buildDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
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
      markerRef.current = new Marker({ color: '#171717' }).setLngLat(lngLat).addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(lngLat);
    }
    mapRef.current.flyTo({ center: lngLat, zoom: 14 });
  }, [selected]);

  function handleSelectResult(feature) {
    const [longitude, latitude] = feature.geometry.coordinates;
    const address = feature.place_name || feature.text;
    const location = { address, latitude, longitude };
    setSelected(location);
    setQuery(address);
    setResults([]);
    onChange?.(location);
  }

  if (!MAPTILER_KEY) {
    if (mode === 'picker') {
      return (
        <div className="space-y-2">
          <input
            value={value?.address || ''}
            onChange={(e) => onChange?.({ address: e.target.value, latitude: null, longitude: null })}
            placeholder="Venue address"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <p className="text-xs text-neutral-400">
            Map-based venue search is unavailable (no <code className="font-mono">VITE_MAPTILER_API_KEY</code>{' '}
            configured) — plain text address for now.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
        Map unavailable — set <code className="font-mono text-xs">VITE_MAPTILER_API_KEY</code> to enable the venue
        map.
        {value?.address && <p className="mt-2 text-neutral-700">{value.address}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mode === 'picker' && (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a venue or address…"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          {searching && <p className="mt-1 text-xs text-neutral-400">Searching…</p>}
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-sm">
              {results.map((feature) => (
                <li key={feature.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(feature)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    {feature.place_name || feature.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-md border border-neutral-200" />

      {mode === 'display' && selected && (
        <a
          href={buildDirectionsUrl(selected.latitude, selected.longitude)}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm font-medium text-neutral-900 underline"
        >
          Get Directions
        </a>
      )}
    </div>
  );
}
