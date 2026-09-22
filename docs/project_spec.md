# NexEvent — Project Specification (Source of Truth for Claude Code)

You are the senior full-stack engineer working directly on this repository.

Your job is to turn this repository into a complete, demo-ready hackathon application called **NexEvent**.

Read this entire document before writing any code. This file is the single source of truth for the project. Refer back to it each session instead of asking the user to re-paste requirements.

**Working rules:**
- Do not paste entire files in chat unless specifically necessary. Edit the repository directly.
- Be concise in responses: prefer "Implemented X. Tests: Y passed. Remaining: Z." over long explanations.
- Work in phases (listed at the end of this document). Implement only the phase you are asked to do. Do not start the next phase unannounced.
- At the end of each phase: run the build, fix errors, run relevant tests, then `git commit` with a message describing exactly what was implemented, and report back.
- If something fails: read the actual error, find the root cause, fix it, re-run, verify. Never claim something works without testing it. Never hide errors.
- If an external API/key is unavailable, keep the architecture correct, use clean config, and fail gracefully — never hard-code fake credentials.
- Do not rewrite working code just because another architecture is possible. Preserve what's good; change only what conflicts with this spec.

---

## 1. Project Overview

**Project name:** NexEvent
**Type:** Event Discovery & Registration Platform

Two roles: **Participant** and **Organizer**.

Participants discover events, search/filter them, view complete event information, register, cancel registrations, and manage their registered events.

Organizers create and manage events, control capacity, view participants, and monitor registration statistics.

The final product should feel like a polished real-world product, not a basic CRUD assignment.

## 2. Evaluation Criteria (what this build is judged on)

| Criterion | Weight |
|---|---|
| Understanding of Problem | 10% |
| Solution Approach & Design | 15% |
| Core Functionality | 20% |
| Code Quality & Structure | 10% |
| Database/API Implementation | 10% |
| Change Request Implementation | 15% |
| Testing & Debugging | 10% |
| Presentation & Explanation | 10% |

Optimize for correct requirements understanding, good architecture, reliable core functionality, clean code, proper DB/API design, easy modification, testing, and a clear demo/explanation — not visual appearance alone.

## 3. Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT, bcrypt
- **Maps:** MapTiler Geocoding API + MapLibre GL JS

Architecture: `React → Express REST API → MongoDB/Mongoose`. The frontend never accesses MongoDB directly. All business rules are enforced by the backend, never only by the frontend.

## 4. Scope Boundaries — explicitly excluded

Do **not** add any of the following, even if it seems like a natural extension:
- QR codes (no QR pass, no QR check-in)
- Payment gateway
- Email/SMS integration
- Chat or social networking features
- Complex ticket marketplace
- AI chatbot or ML-based recommendation infrastructure
- Multi-organization enterprise management
- Unnecessary microservices or cloud infrastructure

Quality over feature quantity. The differentiators (section 15) are the only additions beyond the core CRUD requirements.

## 5. Roles and Permissions

**Participant can:** browse events, search, filter, view event details (with venue map), register, cancel registration, view their registered events.

**Organizer can:** create, edit, publish, cancel events; view participants; view registration statistics; manage capacity and venue location.

The backend must enforce role permissions on every request. Frontend role checks are UX only, never security.

## 6. Authentication & Authorization

Implement: registration, login, JWT issuance, bcrypt password hashing, authenticated user retrieval (`/me`), role-based authorization middleware.

The JWT identifies the current user (`userId`, `role`). **Never trust a client-supplied `participantId` or `organizerId`** when it can be derived from the token — e.g. `POST /api/registrations` takes only `{ eventId }` in the body; the participant is `req.user.id`.

Organizer-mutating routes must verify, in order: (1) user is authenticated, (2) user has the `organizer` role, (3) the organizer owns the specific event being modified.

Never expose password hashes in any API response. All secrets (Mongo URI, JWT secret, MapTiler key) live in environment variables, never in source.

## 7. Data Models

**User**
```
{
  _id,
  name: String (required),
  email: String (required, unique),
  passwordHash: String (required),
  role: "participant" | "organizer" (required),
  createdAt
}
```

**Event**
```
{
  _id,
  name: String (required),
  description: String,
  category: String (enum, required),
  date: Date (required),
  startTime: String (required),
  endTime: String (required),
  mode: "onsite" | "online" (required),
  location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  organizer: ObjectId ref User (required),
  capacity: Number (required, min 1),
  status: "draft" | "published" | "cancelled" (required, default "draft"),
  registrationDeadline: Date | null,
  posterUrl: String | null,
  createdAt,
  updatedAt
}
```

> **Change request (deadline + poster)** added `registrationDeadline` (an
> optional organizer-set cutoff, independent of the event's own start/end
> time — validated to fall before the event starts) and `posterUrl` (a
> data-URI image string, capped at ~5MB server-side; there's no file
> storage integration, matching the project's time constraints). Both are
> optional. See section 9 for deadline enforcement and section 16 for
> where the poster is shown.

**Registration**
```
{
  _id,
  event: ObjectId ref Event (required),
  participant: ObjectId ref User (required),
  status: "registered" | "waitlisted" | "cancelled" (default "registered"),
  waitlistPosition: Number | null,
  createdAt,
  updatedAt
}
```

> **Change request (waitlist management)** added `"waitlisted"` as a third
> status and `waitlistPosition`. A full event no longer rejects a new
> registration outright — the participant joins a FIFO waitlist instead.
> `waitlistPosition` is a 1-based, contiguous (1..N) position among an
> event's currently-waitlisted entries; it's `null` for
> registered/cancelled entries and is recomputed after every join,
> cancellation, or promotion so it never drifts or leaves gaps. See
> section 9 for the full mechanics.

Add appropriate indexes (e.g. compound index on `{event, participant}` to support efficient duplicate-registration checks; index on `Event.status` and `Event.date` for listing queries).

Never delete a Registration on cancellation — flip `status` to `"cancelled"`. Never delete an Event on cancellation — flip `status` to `"cancelled"`. Both preserve history.

Registration counts are always derived from `Registration.countDocuments({event, status: "registered"})` — never stored as a mutable counter on Event, and never inflated by waitlisted entries.

## 8. Event Status & Lifecycle (important — read carefully)

`Event.status` stores **only three values**: `draft | published | cancelled`.

**"Upcoming," "ongoing," "completed," "full," and "almost full" are never stored.** They are computed at read time from `status` + `date` + `startTime` + `endTime` + live registration count, and returned as a derived `displayStatus` (computed in the service layer, or computed client-side from the raw fields — pick one approach and apply it consistently).

Derivation logic:
- If `status === "cancelled"` → displayStatus = `"Cancelled"`
- Else if current time is after `date`+`endTime` → displayStatus = `"Completed"`
- Else if current time is between `date`+`startTime` and `date`+`endTime` → displayStatus = `"Ongoing"`
- Else if `status === "draft"` → displayStatus = `"Draft"`
- Else if registered count ≥ capacity → displayStatus = `"Full"`
- Else if registered count ≥ 90% of capacity → displayStatus = `"Almost Full"`
- Else → displayStatus = `"Upcoming"` / `"Registration Open"`

No scheduled job or cron changes `status`. Only two organizer actions change stored status: `draft → published` (publish) and `published → cancelled` (cancel).

`GET /api/events` (the public/participant-facing listing) **must filter to `status: "published"` only** — draft events are never visible to participants. `GET /api/organizer/events` returns the organizer's own events regardless of status, including drafts.

Registration is only allowed when: `status === "published"` AND displayStatus is not `"Completed"` or `"Cancelled"` AND registered count < capacity AND the participant has no existing active registration for that event.

## 9. Registration Business Logic

`POST /api/registrations`, body `{ eventId }`, participant derived from JWT. Enforce in this exact order, with specific error messages, never raw DB errors:

1. Event exists → else `"Event not found"`
2. `Event.status === "published"` → else `"Registration is closed"`
3. Event is not cancelled → else `"Event has been cancelled"`
4. Event is not completed (end time not passed) → else `"This event has already ended"`
5. No existing **active** (`status: "registered"` OR `"waitlisted"`) registration by this participant for this event → else `"You are already registered for this event"` / `"You are already on the waitlist for this event"`. A previously-cancelled entry does not block rejoining.
6. Active registered count < capacity → create with `status: "registered"`. **Otherwise (change request) — never reject outright:** create with `status: "waitlisted"`, `waitlistPosition` = current waitlisted count + 1 (FIFO append).
7. Return 201. Response shape: `{ status: "registered"|"waitlisted", message, waitlistPosition? (only when waitlisted), registration }`.

`PATCH /api/registrations/:id/cancel` — participant must own the registration (`req.user.id === registration.participant`). Set `status` to `"cancelled"` and `waitlistPosition` to `null`. Never delete. Idempotent: cancelling an already-cancelled entry is a no-op (no re-promotion).

**Waitlist auto-promotion (change request):** if the cancelled entry was `"registered"`, the seat it held is filled automatically:
1. Find the earliest active waitlisted entry for that event (lowest `waitlistPosition`).
2. If one exists, promote it: `status → "registered"`, `waitlistPosition → null`. No participant action needed.
3. Recompute the remaining waitlist's positions to stay contiguous (1..N).

Cancelling a **waitlisted** entry never triggers a promotion — it only removes that entry from the queue and recomputes the remaining positions.

**Hard invariant, holds at all times including after promotion:** registered count for an event never exceeds its capacity — guaranteed because promotion only fires when a registered cancellation just freed exactly one seat, and promotes exactly one waitlisted entry to fill it.

**Race condition note:** two simultaneous requests for the last seat could both pass the capacity check before either writes. If time allows, use `findOneAndUpdate` with an atomic capacity guard or a MongoDB transaction. If not, structure the registration logic in a dedicated service function so this can be upgraded later without touching controllers or routes. Document this as a known limitation either way. (Unchanged by the waitlist change request — left as a documented limitation rather than introducing new infrastructure; a rare simultaneous-last-seat race could theoretically let one extra registration land as "registered" instead of "waitlisted", but never breaks the registered-count ≤ capacity invariant on the promotion path itself.)

**Registration deadline (change request):** an optional per-event cutoff, independent of the event's own start/end time. Checked immediately after the "event already ended" rule and before the duplicate-entry check — applies equally to a direct registration and to joining the waitlist (it's a deadline on *registering*, in the general sense), else `"The registration deadline for this event has passed"`. Enforced only server-side as the source of truth; the client also disables the Register button once the deadline has passed, for UX, but re-checks nothing it can't trust.

## 10. Venue / Map Feature

The organizer must **never manually enter latitude/longitude**.

Organizer flow (Create/Edit Event form): type an address/venue name → debounced call to MapTiler Geocoding API → show candidate results → organizer selects one → show it on a MapLibre GL map with a marker → organizer confirms → save `{address, latitude, longitude}` to `Event.location`.

Participant flow (Event Details page): show venue address as text, an interactive MapLibre map with a marker at the event location, and an optional "Get Directions" link (a plain Google Maps URL built from lat/lng — no API needed for this part).

Build this as a single reusable `EventMap` component (used in both the picker and the display context) so it can be modified without touching unrelated screens. The map is only ever for showing/picking a venue — never for browsing/discovering events.

## 11. Smart Event Discovery

A simple, explainable ranking — not machine learning. On the participant Explore page, add a "Recommended for you" section using this ranked fallback logic, in one documented service function:

1. Events in categories the participant has previously registered for (if any registration history exists)
2. Falling back to: events with the highest current registration count (popularity)
3. Falling back to: events soonest by date

Keep this to a plain sort/filter function with a comment explaining the ranking order. No chatbot, no ML model, no external recommendation service.

## 12. Organizer Analytics

`GET /api/events/:id/analytics` and a dashboard-level rollup. Show only:
- Total events (by the organizer)
- Upcoming events count
- Total registrations (across the organizer's events)
- Available seats (capacity − registered, aggregated or per-event)
- Registration percentage (registered / capacity)
- Event-wise registration counts

No additional charts or metrics beyond this list.

**Change request (waitlist management)** added one metric on top of this
list, not a replacement: a **waitlisted count** (per-event and aggregated).
`registeredCount`, `availableSeats`, and `registrationPercentage` stay
based on `"registered"` entries only — never inflated by the waitlist.

## 13. API Design

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

EVENTS
GET    /api/events                      (published only, supports ?category=&date=&search=)
GET    /api/events/:id
POST   /api/events                      (organizer only; status defaults to "draft")
PUT    /api/events/:id                  (organizer only, must own event)
PATCH  /api/events/:id/publish          (organizer only, must own event)
PATCH  /api/events/:id/cancel           (organizer only, must own event)

REGISTRATIONS
POST   /api/registrations               (participant; body { eventId } only)
PATCH  /api/registrations/:id/cancel    (participant, must own registration)
GET    /api/users/me/registrations      (participant's own, populated with event)

ORGANIZER
GET    /api/organizer/events            (organizer's own events, any status)
GET    /api/events/:id/registrations    (organizer only, must own event)
GET    /api/events/:id/analytics        (organizer only, must own event)
```

You may adjust exact endpoint naming if there's a strong architectural reason — keep the Route → Controller → Service → Model separation regardless.

## 14. Backend Architecture

```
server/
  src/
    config/        (env loading, DB connection)
    models/
    routes/
    controllers/    (thin — parse request, call service, format response)
    services/       (business logic lives here)
    middleware/      (auth, role check, validation, centralized error handler)
    validators/
    utils/
    app.js
    server.js
```

No business logic in route files. Centralized error-handling middleware — controllers/services throw typed errors, middleware formats the response. Use environment variables for `MONGO_URI`, `JWT_SECRET`, `MAPTILER_API_KEY`, `PORT`. Add `.env.example` with these keys and no real values. Never commit `.env`.

## 15. Frontend Architecture

```
client/
  src/
    components/     (EventCard, EventFilters, EventSearch, EventStatus,
                      CapacityIndicator, EventMap, RegistrationButton,
                      AnalyticsCard, ConfirmDialog, EmptyState,
                      LoadingState, ErrorState)
    pages/
    layouts/
    hooks/
    services/       (axios calls, one module per resource)
    context/         (auth context)
    utils/
    routes/          (protected route wrapper)
    features/
    assets/
```

Avoid giant components — a page composes smaller components rather than containing everything inline.

## 16. Screens

**Public:** Landing page, Login, Signup

**Landing page (change request):** `/` — public marketing page for logged-out visitors (hero, brief feature highlights for participants/organizers, "Get started"/"Log in" CTAs). An already-authenticated visitor is redirected straight to Explore rather than seeing it. Explore itself moved from `/` to `/explore` to make room for this.

**Participant:** Explore Events, Event Details, Registration confirmation, My Registrations, Profile/account

**Organizer:** Dashboard, Create Event, Edit Event, Manage Events, Participants (per event), Analytics

**Explore page:** search, category filter, date filter, sort, event cards, "Recommended for you" section. Cards show: name, category, date/time, venue, organizer, seats/status — no clutter. **Change request:** the "Recommended for you" section is hidden entirely while a search term is active (search results speak for themselves; recommendations return once the search is cleared).

**Event Details page** must answer, at a glance: What is this? When? Where (with map)? Who's organizing it? How many seats left? Am I registered? — and, since the waitlist change request, *am I waitlisted, and at what position?* **Change request:** also shows the event poster (if the organizer uploaded one) as a banner image at the top, and the registration deadline (if the organizer set one) alongside the other at-a-glance facts.

**Organizer Dashboard:** stats strip (section 12 metrics) + event management list (status, date, registered/capacity, actions: View, Edit, Publish, Cancel, Participants, Analytics). Not a dense admin table.

**Participants (per event)**, since the waitlist change request: two lists, **Registered** and **Waitlisted** (the latter showing each entry's position), rather than one flat list.

**My Registrations**, since the waitlist change request: each row shows `"Registered"` or `"Waitlisted · #N"`; a promoted entry reads as `"Registered"` automatically, with no participant action.

## 17. UI/UX Direction

Premium, modern, clean, minimal, professional, commercial-quality, responsive. Strong visual hierarchy, generous whitespace, consistent spacing, restrained color palette, excellent typography, subtle animations, clear loading/empty/error states.

Avoid: generic Bootstrap look, excessive cards/gradients/shadows/glassmorphism, huge typography, excessive badges, unnecessary animation, cluttered tables, template-like design.

Mobile is designed intentionally — not a squeezed desktop layout.

## 18. Validation

Frontend validation for UX; backend validation is mandatory regardless. Validate: required fields, email format, password strength, event date/time validity (end after start), capacity (≥1), category, location, and — for every mutating request — authorization/ownership and registration state. Return clear, user-facing error messages; never leak raw Mongoose/DB errors.

## 19. Security Checklist

bcrypt password hashing · JWT auth · protected routes · role-based authorization · organizer ownership checks on every event mutation · backend validation on every input · environment variables for all secrets · centralized error handling · no secrets in source · never trust client-supplied user IDs · never return password hashes in any response.

This is practical hackathon-appropriate security, not a claim of enterprise-grade hardening.

## 20. Testing

Minimum coverage (Jest + Supertest for API tests):

- **Auth:** signup, login, invalid credentials, protected-route rejection without token
- **Events:** create, edit, publish, cancel, unauthorized organizer access, invalid data rejected
- **Registration:** successful registration, duplicate registration rejected, full event rejected, cancelled event rejected, completed event rejected, cancellation succeeds, seat becomes available again after cancellation
- **Map:** geocoding search returns results, coordinates save correctly to an event (mock the MapTiler call in tests)
- **Analytics:** registration count and available seats compute correctly

Plus a manual end-to-end pass through the full demo flow (section 22) before considering any phase complete.

## 21. Change-Request Readiness

15% of the grade is here — the architecture must let a new requirement be added without rewriting the app. Achieve this by: keeping business logic in services (not controllers or routes), using enums/constants instead of magic strings, building reusable components and validators, keeping clean API boundaries, and avoiding duplicated logic.

Example future change requests this architecture should absorb cleanly: waitlist, registration deadline, online-event support, organizer approval step, per-event capacity changes, a third user role, event banner image, additional filters, additional analytics metrics. When one arrives: identify affected model → API → backend logic → frontend → validation → tests, then implement without breaking existing functionality, then regression-test.

## 22. Demo Flow

**Participant:** login → explore events → search/filter → open event → view full details incl. map → register → see confirmation → open My Registrations → cancel a registration → see seat count update.

**Organizer:** login → dashboard → create event → set venue via map search → publish → view registrations → view participants → view analytics → edit event → cancel event.

**Also demonstrate live:** duplicate registration blocked, capacity enforced (event reaches "Full"), cancellation releases a seat, a cancelled event rejects new registrations.

## 23. Documentation

Maintain `docs/`:
```
00_project_spec.md          (this file)
04_database_schema.md
05_api_specification.md
06_system_design.md
08_project_status.md        (running progress log — update after each phase)
README.md                   (setup/run instructions, feature checklist)
```

Documentation must match actual implementation — never document a feature that doesn't exist. Include diagrams where useful (architecture, DB relationships, registration flow, auth flow).

---

## 24. Development Phases

Work through these phases **one at a time, each as a separate instruction**. Do not start a phase until told to. At the end of each phase: build, test, fix, commit, report status, then stop.

1. **Inspect** — read the existing repository (if any code exists), identify what's there vs. this spec, report a short assessment (what exists / what's correct / what's missing / what conflicts). No code changes yet.
2. **Foundation** — project scaffold, folder structure, env config, DB connection, health-check route.
3. **Auth** — User model, signup, login, JWT, bcrypt, role middleware, client auth context + protected routes.
4. **Event management** — Event model, CRUD + publish/cancel routes with ownership checks, seed script, Explore + Event Details pages (read-only), organizer Create/Edit form.
5. **Registration & capacity** — Registration model, registration service enforcing section 9's rules in order, cancel endpoint, wired-up Register/Cancel UI, real seat counts on cards.
6. **Discovery & My Registrations** — search/filter/sort on Explore, "Recommended for you" section (section 11), My Registrations page.
7. **Organizer dashboard & analytics** — stats endpoints, dashboard UI, participants list per event.
8. **Map integration** — MapTiler geocoding in the event form, MapLibre display on Event Details, Get Directions link.
9. **Polish** — loading/empty/error states, confirm dialogs, toasts, responsive pass across all screens.
10. **Testing** — the full test suite from section 20, fix anything it surfaces.
11. **Docs & demo prep** — fill in `docs/`, update `08_project_status.md`, verify the full demo flow (section 22) end to end.

Stopping after any phase still leaves a working, committed, demoable application — phases 1–7 alone satisfy the full original problem statement; 8–11 are additive polish, differentiation, and rigor.