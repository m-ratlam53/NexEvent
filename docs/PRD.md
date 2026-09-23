# NexEvent — Product Requirements Document

Reverse-engineered from the current codebase (not from `docs/project_spec.md` or `docs/08_project_status.md`, which are treated only as background — see the Discrepancies section for where they diverge from what's actually implemented).

## 1. Product Summary

NexEvent is a two-sided event discovery and registration platform. **Organizers** create, publish, and manage events with capacity limits; **Participants** discover, search, and register for events. The system enforces a single source of truth for seat counts (derived live from registration records, never a stored counter — [server/src/services/event.service.js:45-55](server/src/services/event.service.js)), auto-manages a FIFO waitlist when an event fills up, and exposes registration analytics to organizers.

The problem it solves: manual event sign-up (spreadsheets, forms) has no capacity enforcement, no fair queuing when a seat frees up, and no visibility into registration trends. NexEvent automates capacity gating, waitlist promotion, and analytics computation server-side, with a UI that never asks the user to distinguish "registered" from "waitlisted" as separate flows — one Register button handles both ([client/src/components/RegistrationButton.jsx:86-99](client/src/components/RegistrationButton.jsx)).

## 2. Roles & Permissions

Two roles, fixed at signup and never editable afterward ([server/src/services/auth.service.js:42](server/src/services/auth.service.js) — role is explicitly excluded from the profile-update path):

| Capability | Participant | Organizer |
|---|---|---|
| Browse/search/filter published events | ✅ (`GET /api/events`, public) | ✅ |
| View recommended events | ✅ (`GET /api/events/recommended`, role-gated) | ❌ |
| Register / cancel / join waitlist | ✅ | ❌ (`authorize(PARTICIPANT)` on registration routes — [server/src/routes/registration.routes.js:8-9](server/src/routes/registration.routes.js)) |
| View own registrations | ✅ (`GET /api/users/me/registrations`) | n/a |
| Create / edit / publish / cancel events | ❌ | ✅ (`authorize(ORGANIZER)` — [server/src/routes/event.routes.js:13-16](server/src/routes/event.routes.js)) |
| View an event's participant list | ❌ | ✅, owner only (checked in service layer, not just role — [server/src/services/registration.service.js:179-187](server/src/services/registration.service.js)) |
| View organizer dashboard / analytics | ❌ | ✅ |
| Edit own profile, change password | ✅ | ✅ |

Ownership is enforced at the service layer, not just role: an organizer can only update/publish/cancel/view-registrations/view-analytics for events where `event.organizer === req.user.id` ([server/src/services/event.service.js:66-73](server/src/services/event.service.js), [server/src/services/analytics.service.js:74-79](server/src/services/analytics.service.js)). A draft event is invisible to everyone except its owning organizer, even via direct link ([server/src/services/event.service.js:147-154](server/src/services/event.service.js)).

## 3. Core Features (User Stories)

### Event discovery & search
- As a Participant, I can browse all **published** events, filtered by category, a specific date (matches any multi-day event overlapping that date), free-text search on name/description, and sorted by date/popularity/name ([server/src/services/event.service.js:120-145](server/src/services/event.service.js), [client/src/pages/Explore.jsx](client/src/pages/Explore.jsx)).
- As a Participant, I see a "Recommended for you" rail: events in categories I've previously registered for (ranked by popularity, then soonest date), falling back to all upcoming events ranked the same way if I have no history or no current events match my categories ([server/src/services/discovery.service.js](server/src/services/discovery.service.js)).
- As a Participant, I can view full event details, including a live-derived status badge (Draft/Upcoming/Almost Full/Full/Ongoing/Completed/Cancelled) and my own registration/waitlist state on that event ([server/src/utils/deriveDisplayStatus.js](server/src/utils/deriveDisplayStatus.js), [server/src/services/event.service.js:147-185](server/src/services/event.service.js)).

### Registration & waitlist
- As a Participant, I can register for a published event with open seats; if I register for a full event, I'm added to a FIFO waitlist instead of being rejected ([server/src/services/registration.service.js:53-116](server/src/services/registration.service.js)).
- As a Participant, I can hold only one active entry (registered or waitlisted) per event at a time; a prior cancelled entry doesn't block rejoining ([server/src/services/registration.service.js:77-88](server/src/services/registration.service.js)).
- As a Participant, when I cancel a confirmed registration, the earliest-queued waitlisted participant is automatically promoted to registered, and everyone else's queue position is recomputed to stay contiguous (1..N) ([server/src/services/registration.service.js:118-155](server/src/services/registration.service.js)).
- As a Participant, cancelling a waitlist entry (vs. a confirmed seat) never triggers a promotion — it only closes the gap behind it ([server/src/services/registration.service.js:134-139](server/src/services/registration.service.js)).
- As a Participant, registration is blocked once an organizer-set registration deadline passes, once the event ends, or if the event is cancelled/unpublished/not found — each with a distinct error message ([server/src/services/registration.service.js:53-75](server/src/services/registration.service.js)).
- As a Participant, I can view my registrations grouped into Upcoming / Waitlisted / Past / Cancelled tabs ([client/src/pages/MyRegistrations.jsx:49-57](client/src/pages/MyRegistrations.jsx)).

### Event lifecycle (Organizer)
- As an Organizer, I create events in **Draft** status; they're invisible to participants until I explicitly **Publish** them ([server/src/services/event.service.js:75-83,93-101](server/src/services/event.service.js)).
- As an Organizer, I can **Cancel** a published or draft event; existing registrations are preserved (not deleted), and the event's display status becomes "Cancelled" everywhere ([server/src/services/event.service.js:103-108](server/src/services/event.service.js), confirmed by the confirm-dialog copy in [client/src/pages/organizer/Dashboard.jsx:230](client/src/pages/organizer/Dashboard.jsx): "Existing registrations are kept").
- A cancelled event can never be republished ([server/src/services/event.service.js:95-97](server/src/services/event.service.js)).
- As an Organizer, I can create single-day or multi-day events; a multi-day event stores a distinct `endDate`, and same-day time-ordering validation (`endTime > startTime`) is skipped once the event spans multiple calendar days ([server/src/validators/event.validators.js:44-57](server/src/validators/event.validators.js), [server/src/utils/deriveDisplayStatus.js:10-13](server/src/utils/deriveDisplayStatus.js)).
- As an Organizer, I set a venue either by searching/picking a point on a MapTiler-backed map (geocoded, lat/lng captured) or by typing a plain address manually ([client/src/components/EventMap.jsx](client/src/components/EventMap.jsx), [client/src/features/events/EventForm.jsx:353-412](client/src/features/events/EventForm.jsx)).
- As an Organizer, I can upload a poster image (client-resized to a data URI, capped at ~5MB decoded both client- and server-side) ([client/src/features/events/EventForm.jsx:83-101](client/src/features/events/EventForm.jsx), [server/src/validators/event.validators.js:84-86](server/src/validators/event.validators.js)).
- As an Organizer, I view all my events grouped into All/Published/Draft/Completed/Cancelled tabs with live seat and waitlist counts ([client/src/pages/organizer/Dashboard.jsx:73-83](client/src/pages/organizer/Dashboard.jsx)).

### Organizer analytics
- As an Organizer, I see an aggregate dashboard: total events, upcoming events, total registrations, total waitlisted, available seats, and overall registration percentage — computed live from `Registration` documents, never a stored counter ([server/src/services/analytics.service.js:35-72](server/src/services/analytics.service.js)).
- As an Organizer, I see per-event analytics with a capacity breakdown (registered/waitlisted/remaining) chart ([server/src/services/analytics.service.js:74-97](server/src/services/analytics.service.js), [client/src/pages/organizer/EventAnalytics.jsx](client/src/pages/organizer/EventAnalytics.jsx)).
- As an Organizer, waitlist counts are informational only and never inflate the registration percentage or available-seats figures — those are based on `REGISTERED` entries alone ([server/src/services/analytics.service.js:20-23](server/src/services/analytics.service.js)).
- As an Organizer, I can view the participant list (registered + waitlisted, in queue order) for a specific event ([server/src/services/registration.service.js:179-187](server/src/services/registration.service.js)).

### Auth & account
- As a User, I sign up as either role with a validated email/password (min 8 chars, letters + numbers) ([server/src/validators/auth.validators.js:10-28](server/src/validators/auth.validators.js)), and receive a JWT immediately (no email verification step).
- As a User, I stay logged in via a JWT persisted in `localStorage`, re-validated against `GET /api/auth/me` on app load ([client/src/context/AuthContext.jsx:12-38](client/src/context/AuthContext.jsx)).
- As a User, I can update my display name and profile photo (not email or role), and change my password (requires current password) ([server/src/services/auth.service.js:42-61](server/src/services/auth.service.js)).
- As a User, I can toggle light/dark/system theme, persisted client-side only ([client/src/context/ThemeContext.jsx](client/src/context/ThemeContext.jsx)).

## 4. Functional Requirements (traceable)

| Requirement | Enforced by |
|---|---|
| Event capacity is never exceeded by REGISTERED entries under normal (non-concurrent) load | [server/src/services/registration.service.js:90-101](server/src/services/registration.service.js) |
| A full event silently routes new sign-ups to a FIFO waitlist instead of erroring | [server/src/services/registration.service.js:104-115](server/src/services/registration.service.js) |
| Cancelling a registered seat promotes exactly the earliest waitlisted entry | [server/src/services/registration.service.js:140-149](server/src/services/registration.service.js) |
| Waitlist positions stay contiguous 1..N after every join/cancel/promotion | [server/src/services/registration.service.js:12-26](server/src/services/registration.service.js), called at 152 |
| Draft events are hidden from non-owners, including via direct link | [server/src/services/event.service.js:152-154](server/src/services/event.service.js) |
| Registration deadline (if set) blocks new registrations before event start | [server/src/services/registration.service.js:73-75](server/src/services/registration.service.js), validated to precede event start at creation ([server/src/validators/event.validators.js:72-82](server/src/validators/event.validators.js)) |
| Registration counts and analytics are always computed live, never stored | [server/src/services/event.service.js:45-51](server/src/services/event.service.js) (comment states this explicitly) |
| Passwords are hashed with bcrypt (10 salt rounds), never returned in API responses | [server/src/services/auth.service.js:6,14](server/src/services/auth.service.js), [server/src/models/User.js:27-33](server/src/models/User.js) |
| Role-based route access (participant vs organizer) | [server/src/middleware/auth.middleware.js:36-44](server/src/middleware/auth.middleware.js) |

## 5. Non-Functional Requirements (actually enforced)

- **Input validation**: hand-rolled validators (no schema library) reject malformed signup/login/profile/event payloads with aggregated, human-readable error messages joined by `; ` ([server/src/validators/](server/src/validators)).
- **Auth**: stateless JWT (`HS256` via `jsonwebtoken`), 7-day default expiry (`JWT_EXPIRES_IN`), no refresh-token mechanism, no server-side revocation — logout is purely a client-side `localStorage` clear ([client/src/context/AuthContext.jsx:56-60](client/src/context/AuthContext.jsx)).
- **CORS**: locked to a single configured origin in production; any `localhost`/`127.0.0.1` origin (any port) allowed in development ([server/src/app.js:14-29](server/src/app.js)).
- **Payload size caps**: base64-encoded images (event posters, profile photos) capped at ~5MB decoded, both client-side (before encoding) and server-side (post-decode length check) ([server/src/validators/event.validators.js:6-8,84-86](server/src/validators/event.validators.js), [server/src/validators/auth.validators.js:5-8,45-47](server/src/validators/auth.validators.js)).
- **Graceful degradation**: the venue map feature (MapTiler) fully degrades to a plain-text address field when `VITE_MAPTILER_API_KEY`/`MAPTILER_API_KEY` are unset — the app does not require this key to run ([client/src/components/EventMap.jsx:212-220](client/src/components/EventMap.jsx), confirmed in [README.md](README.md)).
- **Error handling**: centralized Express error handler normalizes Mongoose `ValidationError`/`CastError`/duplicate-key errors into consistent `{ error: string }` JSON responses; unexpected errors are logged server-side and never leak internals to the client ([server/src/middleware/errorHandler.js](server/src/middleware/errorHandler.js)).

## 6. Known Gaps / Inconsistencies

- **No automated tests exist**, despite `jest`, `supertest`, and `mongodb-memory-server` being configured as devDependencies with a `test` npm script ([server/package.json:12,24-27](server/package.json)) — a repo-wide search finds zero `*.test.js`/`*.spec.js` files. `docs/08_project_status.md` lists "tests" as one of several not-yet-started items as of an early phase; the current code confirms that gap was never closed, even though every other listed item (auth, events, registration, discovery, analytics, map) was fully implemented.
- **Registration capacity check is not atomic** — explicitly documented as a known, accepted limitation in the code itself: two simultaneous requests for the last seat could both read a count under capacity before either writes, causing a rare over-capacity registration ([server/src/services/registration.service.js:44-51](server/src/services/registration.service.js)).
- **No database-level uniqueness constraint** preventing a participant from holding two active `Registration` documents for the same event — the one-active-entry rule is enforced only in application code ([server/src/services/registration.service.js:77-88](server/src/services/registration.service.js)), not via a partial unique index on `Registration`, so it's subject to the same race class as the capacity check above.
- **No pagination** on any list endpoint (`GET /api/events`, `GET /api/organizer/events`, `GET /api/users/me/registrations`, `GET /api/events/:id/registrations`) — all use unmounded `.find()` and return every matching document ([server/src/services/event.service.js](server/src/services/event.service.js), [server/src/services/registration.service.js](server/src/services/registration.service.js)).
- **No rate limiting** anywhere in the Express middleware stack ([server/src/app.js](server/src/app.js) — only `cors` and `express.json()` are mounted before the routes).
- **No password reset / forgot-password flow** — only signup, login, and an authenticated change-password endpoint exist ([server/src/routes/auth.routes.js](server/src/routes/auth.routes.js)).
- **Email is permanently fixed at signup** — there is no email-change endpoint, and this is a deliberate choice per an in-code comment (no verification flow to safely support it) ([server/src/services/auth.service.js:38-41](server/src/services/auth.service.js)).

## 7. Out of Scope (as built)

- Payments / paid tickets
- Email or push notifications (registration confirmation, waitlist promotion, event reminders — all feedback is in-app toast only)
- File-storage integration for images (posters/avatars are base64 data URIs embedded directly in MongoDB documents, not uploaded to S3/Cloudinary/etc.)
- Multi-organizer / team ownership of a single event
- Recurring events
- Check-in / attendance tracking at the event itself
- Admin/superuser role

---
Verified against commit `1c3b4a1`.
