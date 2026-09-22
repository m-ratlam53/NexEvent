# NexEvent

Event Discovery & Registration Platform — a MERN-stack hackathon build with two roles (Participant, Organizer), full event lifecycle management, a FIFO waitlist, a venue map, and organizer analytics.

## Prerequisites

- Node.js 18+ and npm
- A running MongoDB instance (local, or a connection string to Atlas)
- *(Optional)* A [MapTiler](https://www.maptiler.com/) API key for the venue map/geocoding feature — the app runs fully without one, falling back to a plain-text venue address field

## 1. Install dependencies

```
cd server && npm install
cd ../client && npm install
```

## 2. Configure environment variables

Copy the example files and fill in real values — never commit the resulting `.env` files (already git-ignored):

```
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/nexevent
JWT_SECRET=<any random string>
JWT_EXPIRES_IN=7d
MAPTILER_API_KEY=<optional>
CLIENT_URL=http://localhost:5173
```

**`client/.env`**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_MAPTILER_API_KEY=<optional — same key as above if you have one>
```

## 3. Seed the database

```
cd server
npm run seed
```

This clears and recreates `Users`/`Events` with 2 organizers, 2 participants, and 6 events spanning draft/published/cancelled and past/future dates. Every seeded account uses password `password123`:

| Email | Role |
|---|---|
| organizer1@nexevent.dev | organizer |
| organizer2@nexevent.dev | organizer |
| participant1@nexevent.dev | participant |
| participant2@nexevent.dev | participant |

## 4. Run the app

In two terminals:

```
cd server && npm run dev     # http://localhost:5000
cd client && npm run dev     # http://localhost:5173
```

Open `http://localhost:5173` and log in with any account above.

## Production build

```
cd client
npm run build
npm run preview
```

## Feature checklist

- [x] Auth: signup, login, JWT, bcrypt, role middleware, protected routes
- [x] Event CRUD: create/edit/publish/cancel with ownership checks; drafts hidden from participants
- [x] Registration & capacity: register, cancel, real seat counts derived live (never a stored counter)
- [x] **Waitlist management** (mid-hackathon change request): a full event queues new registrations FIFO instead of rejecting them; cancelling a registered seat automatically promotes the earliest waitlisted participant
- [x] Discovery: search, category/date filters, sort, "Recommended for you" (explainable ranked fallback, no ML)
- [x] My Registrations page — Registered / `Waitlisted · #N` / Cancelled
- [x] Organizer Dashboard: stats strip, event management list, Participants (Registered/Waitlisted split), per-event Analytics
- [x] Venue map: MapTiler geocoding search + MapLibre display + a plain "Get Directions" link (graceful fallback to a plain-text address field when no MapTiler key is configured)
- [x] Toast notifications, confirm dialogs, loading/empty/error states, responsive layout
- [ ] Automated test suite (Jest/Supertest) — not built; correctness was instead verified through extensive scripted testing directly against the live API, including all 10 required waitlist scenarios and the full demo flow (see `docs/08_project_status.md` for the complete log)

## Project structure

```
server/
  src/
    config/        env loading, DB connection
    models/        User, Event, Registration (Mongoose)
    routes/        Express routers
    controllers/    thin request/response layer
    services/       all business logic lives here
    middleware/      auth, role checks, centralized error handler
    validators/      input validation
    utils/           constants, JWT helpers, AppError, display-status derivation
  scripts/seed.js
client/
  src/
    components/     EventCard, EventStatus, EventMap, RegistrationButton, ...
    pages/          Explore, EventDetails, MyRegistrations, organizer/*
    layouts/        AppLayout (nav shell)
    context/        AuthContext, ToastContext
    services/       axios calls, one module per resource
    routes/         ProtectedRoute
docs/
  project_spec.md       full requirements spec — source of truth for architecture and business rules
  08_project_status.md  running phase-by-phase build log, including every test performed
```

## Known limitations

- **Capacity check is not atomic** (documented in `project_spec.md` §9): two truly simultaneous requests for the last seat could both read a count under capacity before either writes. Not hit in testing; left as a documented limitation rather than adding transaction infrastructure, per the project's time constraints. The registration logic lives in one service function specifically so this can be upgraded later without touching controllers or routes.
- **No automated test suite.** Business-rule correctness (auth, event lifecycle, registration ordering, capacity, and all waitlist scenarios) was instead verified through direct, scripted testing against the live running API — see `docs/08_project_status.md` for the full record, phase by phase.
- **The organizer's venue search-and-select interaction** was verified by code review, a working geocoding API, and a confirmed live map render, but not click-tested end-to-end in a browser session (see `docs/08_project_status.md`, Phase 8).

## Tech stack

React 19 · Vite · Tailwind CSS v4 · React Router · Node.js · Express · MongoDB · Mongoose · JWT · bcrypt · MapTiler Geocoding API · MapLibre GL JS

---

Full requirements and design decisions: [`docs/project_spec.md`](docs/project_spec.md). Phase-by-phase build log and every test performed: [`docs/08_project_status.md`](docs/08_project_status.md).
