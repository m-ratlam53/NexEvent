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
