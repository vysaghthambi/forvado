# Forvado — Football Tournament Tracker

A full-stack football tournament management platform with real-time match tracking, built with Next.js 16, Supabase, and Prisma.

## Features

- **Tournament Management** — Create and manage LEAGUE, KNOCKOUT, and GROUP+KNOCKOUT tournaments
- **Team Management** — Team creation, player invitations, join requests
- **Live Match Control** — Phase-accurate state machine (normal time → extra time → penalties)
- **Real-time Updates** — Live score, event feed, and match clock via Supabase Realtime
- **Role-based Access** — PLAYER, TEAM_OWNER, COORDINATOR, and ADMIN roles
- **In-app Notifications** — Real-time notification bell with unread count

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (via Supabase) |
| ORM | Prisma v7 (with PrismaPg adapter) |
| Auth | Supabase Auth (OAuth) |
| Real-time | Supabase Realtime (postgres_changes + broadcast) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Forms | react-hook-form + Zod v4 |
| Testing | Vitest (unit) + Playwright (E2E) |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/vysaghthambi/forvado.git
cd forvado
pnpm install
```

### 2. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Session pooler (port 6543) — runtime
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (port 5432) — migrations
DIRECT_URL=postgresql://postgres.xxx:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

```bash
pnpm db:migrate
```

### 4. Configure Supabase Auth

In your Supabase dashboard:
1. Enable Google OAuth under **Authentication → Providers → Google**
2. Add `http://localhost:3000/api/auth/callback` as an allowed redirect URL

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/         # Login and setup wizard (no navbar)
  (dashboard)/    # Main app pages (dashboard, teams, tournaments, matches, profile)
  api/            # Route handlers
components/
  layout/         # DashboardNav (desktop + mobile hamburger)
  matches/        # LiveScore, MatchTimeline, PhaseControl, EventLogger, LineupPanel, PenaltyTracker
  teams/          # Roster, invitations, invite dialog
  tournaments/    # TournamentCard, StandingsTable, FixturesList, CreateFixtureDialog, etc.
  notifications/  # NotificationBell (Realtime)
  profile/        # EditProfileForm
lib/
  prisma.ts       # Prisma singleton (PrismaPg adapter)
  auth.ts         # requireUser(), findOrCreateUser()
  rbac.ts         # Role guards for API routes
  realtime.ts     # Supabase Realtime broadcast helper
  supabase/       # Server, client, and middleware Supabase clients
services/
  tournaments.ts  # canManageTournament(), getTournamentWithDetails()
  standings.ts    # calculateStandings(), calculateGroupStandings()
  notifications.ts
hooks/
  use-match-timer.ts  # Phase-accurate live match clock (1s updates)
__tests__/
  phase-state-machine.test.ts  # Vitest unit tests (28 tests)
e2e/
  auth.spec.ts         # Playwright E2E tests
  match-lifecycle.spec.ts
  tournaments.spec.ts
```

## Match Phase State Machine

```
SCHEDULED
  └─→ FIRST_HALF → HALF_TIME → SECOND_HALF → FULL_TIME
                                                 ├─→ COMPLETED         (normal time win)
                                                 ├─→ EXTRA_TIME_FIRST_HALF
                                                 │     → EXTRA_TIME_HALF_TIME
                                                 │     → EXTRA_TIME_SECOND_HALF
                                                 │     → EXTRA_TIME_FULL_TIME
                                                 │           ├─→ COMPLETED    (AET win)
                                                 │           └─→ PENALTY_SHOOTOUT
                                                 │                 └─→ COMPLETED
                                                 └─→ PENALTY_SHOOTOUT → COMPLETED
```

## User Roles

| Role | Permissions |
|---|---|
| PLAYER | View tournaments, join teams, view matches |
| TEAM_OWNER | All PLAYER + manage team, invite players, register for tournaments |
| COORDINATOR | All TEAM_OWNER + control match panels, log events for assigned tournaments |
| ADMIN | Full access — create tournaments, assign coordinators, manage all data |

## Running Tests

```bash
# Unit tests (Vitest — 28 tests)
pnpm test

# E2E tests (Playwright) — requires running app
pnpm test:e2e

# Watch mode
pnpm test:watch
```

## Database Commands

```bash
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema without migration (dev only)
pnpm db:studio     # Open Prisma Studio
```

## Key Architectural Notes

- **Prisma v7**: Connection URLs live in `prisma.config.ts`, not `schema.prisma`. Runtime client uses `PrismaPg` adapter.
- **Next.js 16**: `proxy.ts` replaces `middleware.ts` for route interception.
- **Tailwind v4**: Config is in CSS (`@theme inline`), no `tailwind.config.ts`.
- **Supabase Realtime**: Uses `postgres_changes` for score/event updates + REST broadcast for instant phase change notifications.
- **Dark theme**: Forced globally via `className="dark"` on `<html>` with football green primary (`oklch(0.723 0.215 149.578)`).
- **Zod v4**: Uses `{ error: '...' }` instead of `invalid_type_error`. String-based schemas for react-hook-form to avoid coerce type mismatch.
