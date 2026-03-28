# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build (uses --webpack flag)
pnpm lint             # ESLint
pnpm format           # Prettier (includes tailwind plugin)
pnpm test             # Vitest unit tests
pnpm test:watch       # Vitest watch mode
pnpm test:e2e         # Playwright E2E (requires running dev server)
pnpm db:migrate       # Prisma migrate dev
pnpm db:push          # Push schema without migration
pnpm db:studio        # Open Prisma Studio
```

## Architecture

**Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma v7, Supabase, shadcn/ui, Zod v4, react-hook-form, TanStack Query, Zustand.

### Prisma v7 Setup
- `prisma/schema.prisma` has no `url` in datasource — connection URLs are configured externally
- Runtime client uses `PrismaPg` adapter with a `pg.Pool` (see `lib/prisma.ts`)
- `DATABASE_URL` = session pooler (port 6543) for runtime; `DIRECT_URL` = direct (port 5432) for migrations
- Run `pnpm postinstall` (i.e. `prisma generate`) after changing schema

### Next.js 16 Specifics
- `proxy.ts` replaces `middleware.ts` — exports `proxy()` function and `config.matcher`
- Edge-compatible: only checks Supabase session, no Prisma in proxy

### Route Layout Groups
- `app/(auth)/` — login, setup wizard (no navbar)
- `app/(dashboard)/` — all authenticated pages (with navbar)
- `app/api/` — REST route handlers (BFF pattern): `auth/`, `matches/`, `notifications/`, `teams/`, `tournaments/`, `users/`

### Auth Flow
- Google OAuth → `/api/auth/callback` → `findOrCreateUser()` → redirect to `/setup` or `/dashboard`
- **Server Components**: `requireUser()` from `lib/auth.ts` (redirects if not authenticated or profile incomplete)
- **API routes**: `getSessionUser()` / `requireAdmin()` / `requireCoordinator()` from `lib/rbac.ts` (returns `{ user, error }` pattern — check `if (error) return error`)

### RBAC
- Role hierarchy: ADMIN > TEAM_OWNER > PLAYER
- `lib/rbac.ts` exports role guards: `requireAdmin()`, `requireCoordinator()`, `requireTeamOwner()`, `requirePlayer()`
- Tournament coordinators checked via `TournamentCoordinator` join table, not user role alone

### Real-time
- Supabase Realtime `postgres_changes` for score/event updates
- REST broadcast via `lib/realtime.ts` for instant phase-change notifications

### Tailwind v4
- Config is in CSS (`globals.css` with `@theme inline`), no `tailwind.config.ts`
- Dark theme forced globally via `className="dark"` on `<html>`
- Shared input/label styles in `lib/styles.ts`

### Zod v4
- Uses `{ error: '...' }` instead of `invalid_type_error` (removed in v4)
- Use string-based schemas for react-hook-form fields to avoid coerce input/output type mismatch

### Match Phase State Machine
Matches follow a strict phase progression:
```
SCHEDULED → FIRST_HALF → HALF_TIME → SECOND_HALF → FULL_TIME
  → COMPLETED (normal win)
  → EXTRA_TIME_FIRST_HALF → ET_HALF_TIME → ET_SECOND_HALF → ET_FULL_TIME
      → COMPLETED (AET win) or → PENALTY_SHOOTOUT → COMPLETED
  → PENALTY_SHOOTOUT → COMPLETED (direct from FULL_TIME)
```
Phase timestamps stored on Match model (e.g. `firstHalfStartedAt`, `halfTimeAt`). Unit tests in `__tests__/phase-state-machine.test.ts`.

### Services Layer
- `services/tournaments.ts` — `canManageTournament()`, `getTournamentWithDetails()`
- `services/standings.ts` — `calculateStandings()`, `calculateGroupStandings()`
- `services/notifications.ts` — notification creation helpers
- `services/teams.ts` — team-related business logic

### Path Alias
`@/*` maps to project root (configured in `tsconfig.json`).
