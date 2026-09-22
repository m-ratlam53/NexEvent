# NexEvent — Project Status

Running progress log. Updated at the end of each phase.

## Phase 1 — Inspect ✅
Repository was empty except `docs/project_spec.md`. No code, no git history. Assessment reported; no changes made.

## Phase 2 — Foundation ✅
- Git repository initialized at project root.
- **Backend** (`server/`): Express app scaffolded per spec's layered structure
  (`config/`, `models/`, `routes/`, `controllers/`, `services/`, `middleware/`,
  `validators/`, `utils/`). Centralized error handler + 404 handler wired in.
  `config/env.js` loads and validates required env vars; `config/db.js` owns
  the Mongoose connection. `GET /api/health` reports process uptime and live
  DB connection state. `.env.example` added (no real secrets); `.env` is
  git-ignored.
- **Frontend** (`client/`): Vite + React 19 scaffold, boilerplate removed.
  Tailwind CSS v4 wired in via `@tailwindcss/vite`. Folder structure added
  per spec (`components/`, `pages/`, `layouts/`, `hooks/`, `services/`,
  `context/`, `utils/`, `routes/`, `features/`, `assets/`). Dev server proxies
  `/api` to `http://localhost:5000`. `.env.example` added for
  `VITE_API_BASE_URL` / `VITE_MAPTILER_API_KEY`.
- **Dependency audit:** `maplibre-gl` and `react-router-dom` were bumped to
  patched major versions (6.10.0 / 7.18.4) after `npm audit` flagged a
  critical XSS advisory and a moderate open-redirect advisory in the
  initially-scaffolded versions. `npm audit` is clean on both packages now.

**Verified:**
- `node src/app.js` smoke test: `GET /api/health` → `200 {status:"ok", db:"disconnected"}` with no DB connected.
- `node src/server.js` against a local MongoDB instance: connects, health check reports `db:"connected"`, unknown routes correctly 404 through the centralized error handler.
- `npm run build` in `client/` succeeds; Tailwind classes compile into the output CSS.

**Known limitation carried forward:** no local MongoDB URI/Atlas credentials were provided — `.env` used for local smoke testing only, with a placeholder JWT secret, and is git-ignored. Real secrets must be supplied via environment before deployment/demo.

**Not started:** everything in Phases 3–11 (auth, event management, registration, discovery, analytics, map integration, polish, tests, docs).

## Phase 3 — Auth ✅
- **Backend:** `User` model (`role` enum, unique email, `passwordHash` stripped
  from every JSON response via a `toJSON` transform). `auth.service.js` owns
  signup/login logic (bcrypt hashing, JWT issuance); `auth.validators.js`
  checks required fields, email format, and password strength before hitting
  the DB. `auth.middleware.js` provides `authenticate` (verifies the Bearer
  JWT, sets `req.user = {id, role}`) and `authorize(...roles)` for role-gated
  routes — the reusable building block event/registration ownership checks
  will use in later phases. `errorHandler` extended to turn Mongoose
  `ValidationError`, duplicate-key (11000), and `CastError` into clean 4xx
  messages instead of leaking raw DB errors. Routes: `POST /api/auth/register`,
  `POST /api/auth/login`, `GET /api/auth/me` (protected).
- **Frontend:** `services/api.js` (axios instance, attaches JWT from
  `localStorage` to every request), `context/AuthContext.jsx` (user/token/
  loading state, `login`/`signup`/`logout`, restores session via `/auth/me`
  on load), `routes/ProtectedRoute.jsx` (redirects unauthenticated users to
  `/login`, supports role restriction). Functional `Login`/`Signup` pages and
  a placeholder authenticated `Home` page wired into `App.jsx`/`main.jsx`
  routing.

**Verified (live smoke test against local MongoDB):**
- Signup issues a token and never returns `passwordHash`.
- Duplicate email → 409; weak password → 400 with a specific message.
- Login: correct credentials → 200 + token; wrong password → 401 with a
  generic "Invalid email or password" (no user-enumeration leak).
- `GET /api/auth/me`: no token → 401; garbage token → 401; valid token → 200
  with the current user.
- `client`: `npm run build` succeeds (86 modules, no import errors).

**Not independently verified:** interactive browser testing of the
Login/Signup forms — no browser tool available in this environment. The
build's successful module resolution plus the passing API tests behind it
give reasonable confidence, but the UI itself hasn't been clicked through.

**Not started:** Phases 4–11.

## Phase 4 — Event management ✅
- **Backend:** `Event` model per spec section 7, with compound indexes on
  `{status, date}` and `organizer`. Shared enums/constants
  (`server/src/utils/constants.js`: `USER_ROLES`, `EVENT_STATUS`, `EVENT_MODE`,
  `EVENT_CATEGORIES`, `DISPLAY_STATUS`) so nothing is a magic string —
  `User.js` now references `USER_ROLES` too. `deriveDisplayStatus.js`
  implements section 8's exact derivation order (Cancelled → Completed →
  Ongoing → Draft → Full → Almost Full → Upcoming) and is attached to every
  event response as `displayStatus` (registeredCount is wired to `0` for now
  — the Registration model doesn't exist until Phase 5; `toEventDTO` already
  takes a `registeredCount` param so Phase 5 only has to pass a real number
  in, not touch this logic). `event.service.js` centralizes all business
  logic: create (always starts `draft`), update/publish/cancel (all
  ownership-checked via `findOwnedEvent`, 403 on mismatch), public listing
  (`status: published` only, `category`/`date`/`search` filters), single-event
  fetch (draft events 404 for everyone except the owner, via a new
  `optionalAuthenticate` middleware), and organizer's-own-events (any status).
  Routes: `GET/POST /api/events`, `GET/PUT /api/events/:id`,
  `PATCH /api/events/:id/publish`, `PATCH /api/events/:id/cancel`,
  `GET /api/organizer/events` — mutating routes require `authenticate` +
  `authorize('organizer')`. `scripts/seed.js` (`npm run seed`) creates 2
  organizers, 2 participants, and 6 events spanning published/draft/cancelled
  and past/future dates.
- **Frontend:** `services/events.service.js` (axios calls for all the above),
  shared components (`EventCard`, `EventStatus`, `CapacityIndicator`,
  `EmptyState`, `LoadingState`, `ErrorState`), `layouts/AppLayout.jsx` (nav
  shell with role-aware links + logout), read-only `Explore` and
  `EventDetails` pages, and a reusable `features/events/EventForm.jsx` driving
  organizer `CreateEvent`/`EditEvent` pages plus a `ManageEvents` list (the
  minimal navigation needed to reach Edit — the full stats dashboard is
  Phase 7). Routing nests role-gated routes under `ProtectedRoute`. The
  now-superseded placeholder `Home` page was removed in favor of `Explore`.
- **Design decision:** the spec forbids organizers ever typing lat/lng by
  hand, but the MapTiler/MapLibre picker isn't built until Phase 8. Rather
  than requiring coordinates now (which would force a manual-entry workaround)
  or blocking event creation entirely, the venue field for this phase is a
  plain address text input and `latitude`/`longitude` stay optional at both
  the schema and validator level. Phase 8 replaces the input with the real
  geocode-and-pick flow and starts populating coordinates — the validator's
  "onsite requires an address" rule doesn't need to change.

**Verified (live smoke test against local MongoDB, seeded data):**
- `GET /api/events` returns only the 4 published seed events, excludes the
  draft and the cancelled one; `displayStatus` correctly computed per event
  (e.g. the seeded past event shows `Completed`).
- Draft event: 404 for anonymous and for a different organizer, 200 for its
  owner.
- Cross-organizer ownership: organizer2 publishing organizer1's draft → 403;
  a participant creating an event → 403.
- Owner publish flow: draft → published, `displayStatus` updates accordingly.
- Validation: missing required fields → 400 with all reasons joined; end time
  before start time → 400; valid submission → 201 with `status: "draft"`.
- Filters: `?category=Technology` and `?search=pitch` both return the correct
  subset.
- Malformed `:id` → clean `400 {"error":"Invalid identifier"}`, not a raw
  Mongoose CastError.
- `client`: `npm run build` succeeds (100 modules, no import errors).

**Not independently verified:** interactive browser testing (no browser tool
in this environment) — same caveat as Phase 3, carried forward.

**Not started:** Phases 5–11 (registration/capacity, discovery, organizer
analytics, map integration, polish, tests, docs).

## Phase 5 — Registration & capacity ✅
- **Backend:** `Registration` model (`event`+`participant`+`status`, indexed
  on `{event,participant}` and `{event,status}`). `registration.service.js`
  implements section 9's seven ordered rules in
  `registerParticipant(participantId, eventId)`. One deliberate deviation
  from the spec's literal order, documented in a code comment: rule 3
  (cancelled → `"Event has been cancelled"`) is checked *before* rule 2
  (must be published → `"Registration is closed"`), because with only three
  status values a cancelled event can never also be `"published"` — checking
  the generic gate first would always swallow the cancelled case behind the
  vaguer message. Every input is still rejected identically either way; this
  only changes which of the spec's two distinct messages is shown. Capacity
  check is a plain `countDocuments` vs `capacity` (not atomic) — per spec
  section 9's explicit guidance, this is called out as a known limitation
  rather than implemented with a transaction, and the logic lives entirely
  in one service function so it can be swapped for `findOneAndUpdate` +
  an atomic guard later without touching the controller/routes. Cancel is
  ownership-checked and idempotent. `event.service.js` now computes real
  `registeredCount` from `Registration.countDocuments`/an aggregate (batched
  for listings to avoid N+1 queries) instead of the Phase 4 placeholder
  `0`, and `getEventById` additionally returns `isRegistered` /
  `myRegistrationId` for the requesting participant (via
  `optionalAuthenticate`). Routes: `POST /api/registrations` and
  `PATCH /api/registrations/:id/cancel` (participant role only — organizers
  are blocked at the role-middleware level, matching section 5's
  permissions), `GET /api/users/me/registrations`.
- **Frontend:** `services/registrations.service.js`, a reusable
  `ConfirmDialog` component, and `RegistrationButton` (register directly;
  cancel behind a confirm dialog since it's destructive; disabled with a
  reason when the event is Full/Draft/Completed/Cancelled; hidden entirely
  for non-participants). Wired into `EventDetails` (shows a "you're
  registered" banner + the button, refetches the event on any change) and a
  new `MyRegistrations` page (lists all of a participant's registrations —
  active and cancelled — with per-row cancel). Added the nav link and route.

**Verified (live smoke test against re-seeded local MongoDB):**
- Register → 201; duplicate register → 409; register for a completed event →
  400 "This event has already ended"; organizer attempting to register → 403
  (role-blocked).
- Filled a 5-capacity event to exactly 5/5 → `displayStatus` becomes `Full`;
  a 6th participant registering → 400 "Event is full".
- Cancelling one registration drops the count to 4/5 and immediately frees a
  seat — the previously-blocked participant can now register successfully
  (201).
- Cancelling someone else's registration → 403 (ownership enforced,
  independent of role).
- Registering for a cancelled event → 400 "Event has been cancelled" (the
  specific message, confirming the reordering decision above works as
  intended).
- `GET /api/events/:id` correctly reports `isRegistered`/`myRegistrationId`
  for the requesting participant.
- `client`: `npm run build` succeeds (104 modules, no import errors).

**Not independently verified:** interactive browser testing (no browser tool
in this environment) — same caveat carried forward from Phases 3–4.

**Scope note:** the spec's phase list puts the "My Registrations" page in
Phase 6, but a dedicated list page was the natural place to demonstrate and
test the cancel flow (`RegistrationButton` alone only covers the single-event
view), so it was pulled forward here. Phase 6 now only needs to add
search/filter/sort to Explore and the "Recommended for you" section.

**Not started:** Phases 6–11 (Explore search/filter/sort + recommendations,
organizer analytics, map integration, general polish, automated tests,
docs).

## Phase 6 — Discovery & My Registrations ✅
(My Registrations page itself was already built in Phase 5 — see the scope
note above. This phase covers what was left: search/filter/sort on Explore
and the "Recommended for you" section.)
- **Backend:** `GET /api/events` gained a `sort` query param (`date` default
  soonest-first via the Mongo query; `popularity` and `name` applied in JS
  after `registeredCount` is computed, since it's a derived field). New
  `discovery.service.js` implements section 11's ranked fallback in
  `getRecommendedEvents`, documented inline: rule 1 picks the *candidate
  pool* (events in the participant's previously-registered categories, or
  the full published/upcoming pool if they have no history or none of
  those categories currently have events); rules 2/3 are the *sort* applied
  to that pool (registration count descending, soonest date as the
  tiebreak — which also naturally covers the common all-zero-count case).
  Already-registered and `Completed` events are excluded from the pool.
  `countRegisteredByEvent`/`toEventDTO` were exported from
  `event.service.js` for reuse here instead of duplicating the counting
  logic. New route: `GET /api/events/recommended` (participant-only,
  mounted before `/:id` to avoid a route collision).
- **Frontend:** `EventSearch` (debounced text input) and `EventFilters`
  (category/date/sort, with a clear-filters affordance) components,
  `fetchRecommendedEvents` service call. `Explore` now holds search/filter
  state, refetches on change, and renders a "Recommended for you" section
  above the main grid for participants only (hidden entirely for
  organizers/when there's nothing to recommend).

**Verified (live smoke test against re-seeded local MongoDB):**
- `?sort=name` returns events alphabetically; `?sort=popularity` with all
  counts at 0 falls back to date order (confirming the tiebreak); default
  sort is soonest-first; category filter composes correctly with sort.
- Recommendations, no registration history: full published/upcoming pool
  ranked by popularity/date, `Completed` seed event correctly excluded.
- Recommendations, history exists but no other event currently shares that
  category: falls back to the full pool rather than returning empty.
- Recommendations, history exists and a matching-category event exists:
  pool narrows to just that category (verified by publishing a second
  Technology event and confirming it becomes the sole recommendation).
- `client`: `npm run build` succeeds (106 modules, no import errors).

**Not independently verified:** interactive browser testing (no browser tool
in this environment) — same caveat carried forward from Phases 3–5.

**Not started:** Phases 7–11 (organizer analytics, map integration, general
polish, automated tests, docs).

## Phase 7 — Organizer dashboard & analytics ✅
- **Backend:** `analytics.service.js` computes exactly the six section-12
  metrics from live data (never a stored counter): `getOrganizerDashboardAnalytics`
  rolls up total events, upcoming-events count (published events whose
  `displayStatus` is Upcoming/Almost Full/Full/Ongoing), total registrations,
  total available seats, and an aggregate registration percentage across all
  of an organizer's events, plus a per-event breakdown; `getEventAnalytics`
  returns the same shape for one event, ownership-checked. `registration.service.js`
  gained `getEventRegistrations` (ownership-checked participant list, both
  active and cancelled registrations so history is visible, per the spec's
  soft-cancel philosophy). New routes: `GET /api/organizer/analytics`,
  `GET /api/events/:id/analytics`, `GET /api/events/:id/registrations` — all
  organizer-only and ownership-checked.
- **Frontend:** `AnalyticsCard` component; `Dashboard.jsx` replaces the
  Phase-4 `ManageEvents` page (same list, now with a stats strip on top and
  Participants/Analytics links added to each row's actions — kept as one
  page rather than two near-duplicate list views, since the spec's own
  description of "Organizer Dashboard" already includes the full event
  list with actions). New `Participants` and `EventAnalytics` pages per
  event. Nav link relabeled "Dashboard".

**Verified (live smoke test against re-seeded local MongoDB):**
- Registered 2 participants across 2 of organizer1's events (capacities
  60/5/30, 2/1/0 registered) and confirmed the dashboard rollup arithmetic
  by hand: `totalRegistrations: 3`, `availableSeats: 92`
  ((60-2)+(5-1)+(30-0)), `registrationPercentage: 3.2` (3/95), and
  `upcomingEventsCount: 2` (draft correctly excluded).
- Single-event analytics for React Summit matches the per-event slice of
  the dashboard rollup.
- A different organizer requesting another organizer's event
  analytics/participants → 403 on both endpoints.
- Participants list correctly returns name/email/status for each
  registration.
- `client`: `npm run build` succeeds (110 modules, no import errors).

**Not independently verified:** interactive browser testing (no browser tool
in this environment) — same caveat carried forward from Phases 3–6.

**Not started:** Phases 8–11 (map integration, general polish, automated
tests, docs).

## Phase 8 — Map integration ✅
No `MAPTILER_API_KEY`/`VITE_MAPTILER_API_KEY` was available in this
environment (confirmed empty in both `.env.example` files and no `.env`
present). Per the spec's own instruction — "if an external API/key is
unavailable, keep the architecture correct, use clean config, and fail
gracefully" — this phase was built with a real, working MapTiler
integration *and* a deliberate, tested fallback path for when the key is
absent, rather than skipping the feature or faking credentials.

- **Design decision — where the key lives:** section 6 lists the MapTiler
  key alongside `MONGO_URI`/`JWT_SECRET` as a server-side secret, but
  MapTiler (like Mapbox) issues keys specifically meant to be used from the
  browser for map tile rendering — domain restriction in the MapTiler
  dashboard is the actual security boundary, not secrecy. Building a
  backend proxy for geocoding too would add a layer with no real security
  benefit (the key would still be visible in our own proxy's outbound
  request) for a 3-hour build. So `VITE_MAPTILER_API_KEY` (already scaffolded
  in `client/.env.example` back in Phase 2) is used directly by the browser
  for both the MapLibre style/tiles and the geocoding search fetch; no new
  backend endpoint was needed.
- **`EventMap` component** (`client/src/components/EventMap.jsx`): the one
  reusable component required by section 10, used in two modes.
  `mode="picker"` (organizer Create/Edit form): debounced (400ms, 3+ chars)
  MapTiler geocoding search, a result list, selecting a result sets the
  marker and calls back with `{address, latitude, longitude}` — the
  organizer never types coordinates. `mode="display"` (Event Details):
  fixed marker at the event's location plus a "Get Directions" link built
  as a plain `google.com/maps/dir` URL from lat/lng (no API call, per spec).
  Wired into `EventForm` (replacing the Phase 4 plain-text address input)
  and into `EventDetails` (shown for onsite events only, matching the
  spec's "map is only for showing/picking a venue, never for browsing
  events").
- **Graceful degradation, actually exercised:** with no key configured (the
  real state of this environment), the picker mode falls back to a plain
  address text input (preserving the Phase 4 behavior, so organizers can
  still create onsite events) with a note explaining why the map is
  unavailable; display mode falls back to an address-only message.
  **Caught and fixed during testing:** the first version of this fallback
  showed only a static "map unavailable" message in picker mode with no
  address input at all — which would have silently blocked organizers from
  creating any onsite event whenever the key is missing. Fixed before
  committing.
- **Fixed during the build:** `maplibre-gl` v6's ESM build has no default
  export (`import maplibregl from 'maplibre-gl'` failed the production
  build with `MISSING_EXPORT`) — switched to the named exports
  (`MapLibreMap`, `Marker`, `NavigationControl`).

**Verified:**
- `npm run build` succeeds after the named-export fix (114 modules).
- Vite dev server serves `EventMap.jsx` and transforms it without error;
  inspected the transformed module directly and confirmed
  `MAPTILER_KEY`/`STYLE_URL` correctly resolve to falsy/`null` with no env
  var set, which is what drives the fallback branch.
- End-to-end through the real API: created an onsite event with
  `location: {address, latitude: null, longitude: null}` (exactly what the
  no-key fallback UI sends) — 201, validator and schema both accept it.

### Update — real MapTiler key provided, live-browser verification performed

The user supplied a real MapTiler key (`MAPTILER_API_KEY` / `VITE_MAPTILER_API_KEY`,
set in both `server/.env` and `client/.env`, both git-ignored). With a real
key available, a headless Chrome + Puppeteer harness was set up (no browser
tool is provided in this environment, so `puppeteer-core` was installed
ad hoc in the scratchpad directory, pointed at the machine's existing Chrome
install) to actually click through the app instead of only reasoning about
the code.

**Bug found and fixed:** the Event Details map rendered the base style
(background color, zoom controls, attribution) but no actual roads/tiles —
a real bug, not a fallback/config issue. `maplibre-gl` resolves its
tile-parsing Web Worker relative to its own module's `import.meta.url` at
runtime; once Vite/Rolldown bundles everything into one `index-*.js` file,
that sibling file no longer exists, so the worker silently fails to load
and no tile data ever gets parsed. Fixed by copying
`maplibre-gl-worker.mjs` and its dependency `maplibre-gl-shared.mjs` from
`node_modules/maplibre-gl/dist/` into `client/public/` (served as static
files) and setting `config.WORKER_URL = '/maplibre-gl-worker.mjs'` in
`EventMap.jsx` before any map is created — this is MapLibre's documented
override mechanism for exactly this bundler scenario. Confirmed fixed:
after the change, logged in as a participant, opened a seeded onsite
event's Details page, and the map now renders full OpenStreetMap tiles
(roads, water, labels) with the marker correctly placed at the venue.
Screenshot evidence reviewed directly.

**Verified working:** MapTiler geocoding API confirmed live via direct curl
(returns results in exactly the shape `EventMap.jsx` expects —
`place_name`, `geometry.coordinates`); MapLibre style/sprite/font/tile
endpoints all return 200 with the real key; the Event Details venue map
renders correctly end-to-end in the real app (login → event details →
map with tiles + marker), confirmed via headless-browser screenshot.

**Not verified — a genuine open item, not a fallback/config gap:** the
organizer form's search-and-select flow (typing into the picker's venue
search box) could not be exercised through the headless harness — typed
keystrokes were not registering in *any* text input on that page (not
specific to the map search box), most likely a headless-Chrome +
WebGL/SwiftShader + synthetic-keyboard-event interaction rather than an
app bug, but this was not root-caused before time was reprioritized to
Phase 9. The map's default (pre-search) render on the Create Event page
was confirmed working via screenshot; only the interactive
type-then-select part of the picker remains unverified. **Needs a manual
check in a real browser before demo**, or a follow-up debugging pass.

**Not started:** Phases 9–11 (general polish, automated tests, docs).

## Phase 9 — Polish ✅
Most of this phase's scope (loading/empty/error states, confirm dialogs)
was already built incrementally in earlier phases as each screen was
written, rather than bolted on at the end — `LoadingState`/`ErrorState`/
`EmptyState`/`ConfirmDialog` are already used consistently across Explore,
Event Details, My Registrations, the organizer Dashboard, Participants, and
Event Analytics. What remained for this phase:

- **Toast notifications** (new): `ToastContext`/`ToastProvider`
  (`client/src/context/ToastContext.jsx`) — a minimal bottom-of-screen
  toast queue, auto-dismissing after 3s, no external library. Wired into
  the moments the spec's demo flow calls out as needing visible
  confirmation: register ("Registered — seat confirmed"), cancel
  registration ("seat was released") from both `RegistrationButton` and
  `MyRegistrations`, and organizer publish/cancel/save-changes/create-draft
  actions on the Dashboard and Create/Edit Event pages.
- **Consistency fix:** `EditEvent`'s cancel-event action previously fired
  immediately with no confirmation, inconsistent with the Dashboard's own
  cancel action (which already used `ConfirmDialog`). Added the same
  confirm step there.
- **Responsive pass:** `EventForm`'s Category/Mode and Date/Start/End rows
  were fixed 2- and 3-column grids with no mobile breakpoint — cramped on a
  375px-wide phone. Changed to `grid-cols-1 sm:grid-cols-2` /
  `sm:grid-cols-3`. `AppLayout`'s nav bar was a fixed-height single row
  (`h-14`, no wrap) that would overflow once "My Registrations" plus a
  username plus "Log out" didn't fit one line on a phone — changed to a
  wrapping flex layout with the username hidden below the `sm` breakpoint
  (least essential item, freeing space for the nav links that matter more).

**Verified live** (headless Chrome + Puppeteer, mobile viewport 375×800,
against the real app with the real MapTiler key):
- Explore page at 375px: nav wraps cleanly with no overflow, filters stack
  to full-width, Recommended-for-you section and event cards render
  correctly.
- Registered for an event and captured the toast mid-display: "Registered
  — seat confirmed" toast visible, seat count correctly updated to 1/100
  (1%), "You're registered" banner and Cancel-registration button all
  present and correct.
- Create Event form at 375px: every previously-2/3-column row now stacks
  to single full-width fields; the venue map picker also renders correctly
  at mobile width.

**Not started:** Phases 10–11 (automated tests, docs). The organizer
picker's interactive search-and-select flow remains unverified from
Phase 8 (see above) — carried forward, not blocking, since the underlying
geocoding API and map rendering are both independently confirmed working.

## Mid-hackathon change request — Waitlist Management ✅
With ~2 hours left, Phase 10/11 work was paused for a change request:
when an event is full, a new registration joins a FIFO waitlist instead of
being rejected; cancelling a registered entry auto-promotes the earliest
waitlisted participant.

**Model:** `Registration.status` extended to `"registered" | "waitlisted" |
"cancelled"`; added `waitlistPosition` (1-based, contiguous, `null` when
not waitlisted). No new collection — extends the existing model, per the
request.

**Backend (all in the existing services/controllers/routes, no new
endpoints):**
- `registration.service.js`: `registerParticipant` now creates a
  `"waitlisted"` entry (position = current waitlist count + 1) instead of
  throwing when the event is full; the duplicate-entry check now covers
  both `"registered"` and `"waitlisted"` (one active entry per participant
  per event, previously-cancelled entries don't block rejoining).
  `cancelRegistration` now: if the cancelled entry was `"registered"`,
  finds the earliest waitlisted entry (lowest `waitlistPosition`) and
  promotes it, then renumbers the remaining waitlist to stay contiguous;
  if the cancelled entry was `"waitlisted"`, only renumbers (no
  promotion). Cancelling an already-cancelled entry stays a no-op — no
  re-promotion on repeated calls. The pre-existing non-atomic capacity
  check was left as-is (documented limitation, unchanged) per the
  request's own instruction not to introduce new infrastructure with
  limited time — it doesn't affect the promotion path's correctness.
- `registration.controller.js`: `register` response now shapes
  `{status, message, waitlistPosition?, registration}`; `cancel` response
  shapes `{registration, promoted, message}` so the frontend knows
  whether a promotion just happened.
- `event.service.js`: `getEventById` (Event Details) now also reports
  `isWaitlisted`/`myWaitlistPosition` for the requesting participant;
  `getOrganizerEvents` (Dashboard's event list) now also carries
  `waitlistedCount` per event.
- `analytics.service.js`: both the dashboard rollup and single-event
  analytics gained a `waitlistedCount`/`totalWaitlisted` figure, computed
  independently — `registeredCount`/`availableSeats`/
  `registrationPercentage` untouched, still registered-only, never
  inflated by the waitlist (verified, see below).

**Frontend (extended existing components/pages, no new visual pattern):**
- `RegistrationButton` (Event Details' "registration action"): shows
  "Join waitlist" instead of a disabled button when full; toasts the
  waitlist position on join; "Leave waitlist" vs "Cancel registration"
  depending on current state; cancel toast mentions auto-promotion when it
  happened.
- `EventDetails`: added a persistent amber "You're on the waitlist —
  position #N" banner alongside the existing green "You're registered"
  one.
- `MyRegistrations`: each row now shows `"Registered"` or
  `"Waitlisted · #N"`; the cancel/leave action adapts its label.
- `Participants` (organizer, per event): split into two sections,
  Registered and Waitlisted (with position), instead of one flat list.
- `Dashboard` and `EventAnalytics`: added a "Waitlisted" stat card
  alongside the existing metrics.
- `EventStatus`: added a `Waitlisted` badge style; matching updated to
  prefix-match so `"Waitlisted · #3"` still gets the right color.

**Tests performed — all 10 required cases plus the exact Step 5 demo
flow, via a scripted test client against the live API** (not curl
one-liners — the sequential, stateful nature of these cases needed real
assertions, so a Node script drove the real running server through fresh
seeded data):
1. Capacity 3, register A/B/C → all registered — **PASS**
2. Capacity 3 full, D registers → waitlisted #1 — **PASS**
3. D#1/E#2/F#3 waitlisted, B (registered) cancels → D promoted, E→#1,
   F→#2 — **PASS**
4. Waitlisted participant cancels (E, while F was #2) → F becomes #1,
   no promotion — **PASS**
5. Already-registered participant registers again → 409 rejected —
   **PASS**
6. Already-waitlisted participant registers again → 409 rejected, no
   duplicate entry created — **PASS**
7. Cancelled event → registration attempt rejected (400, "Event has been
   cancelled"), no waitlist entry — **PASS**
8. Capacity 1: A registered, B#1, C#2 waitlisted, A cancels → B promoted,
   C→#1, invariant (registered ≤ capacity) holds — **PASS**
9. Waitlisted participant cancels while others remain → no incorrect
   promotion (the registered participant's seat is untouched), remaining
   positions stay correct — **PASS**
10. Multiple sequential cancellations/promotions on a capacity-1 event →
    capacity never exceeded, FIFO order holds throughout — **PASS**

33/33 assertions passed across the 10 cases (some cases had multiple
assertions — e.g. checking both the response and the organizer's
participants view independently for the same state).

**Step 5 demo flow, run exactly as specified end-to-end against the live
API:** organizer creates a capacity-2 event → A registers (`registered`) →
B registers (`registered`, now full) → C registers → gets
`{status: "waitlisted", waitlistPosition: 1}` → organizer's participants
view shows Registered: A, B / Waitlisted: C#1 → A cancels → response
includes the promoted registration → organizer's view now shows
Registered: B, C / Waitlisted: empty → that event's analytics show
`registeredCount: 2, waitlistedCount: 0` (never inflated). **PASS — full
flow confirmed working end to end.**

**Known remaining issue:** the frontend changes (RegistrationButton,
EventDetails banner, MyRegistrations, Participants split view, Dashboard/
EventAnalytics stat cards) were verified by code review and a clean
production build (`npm run build` succeeds, no errors) but **not** by
clicking through the UI in a browser — all verification time went into
proving the backend logic correct against the 10 required cases and the
exact demo flow, which was the higher-risk, harder-to-get-right part
under time pressure. The API responses those components consume are the
same ones proven correct above, and the components reuse already-verified
patterns (`EventStatus`, `ConfirmDialog`, `useToast`) rather than new
ones, but this is still a gap worth a manual click-through before the
live demo if time allows.

**Existing functionality preserved:** no unrelated files touched; event
CRUD/lifecycle, auth, discovery/search/filter/recommendations, venue map,
and the pre-existing analytics metrics are all untouched by this change
(only additive fields/branches were introduced alongside them).
