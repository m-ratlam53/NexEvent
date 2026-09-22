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
