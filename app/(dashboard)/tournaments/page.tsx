import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TournamentsList } from '@/components/tournaments/tournaments-list'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'

export const metadata = { title: 'Tournaments — Forvado' }

type Props = { searchParams: Promise<{ tab?: string }> }

const TOURNAMENT_SELECT = {
  id: true,
  name: true,
  format: true,
  status: true,
  startDate: true,
  endDate: true,
  venue: true,
  maxTeams: true,
  isPublished: true,
  _count: { select: { teams: true, matches: true } },
} as const

const getTournamentsAdmin = unstable_cache(
  () => prisma.tournament.findMany({
    where: { deletedAt: null },
    select: TOURNAMENT_SELECT,
    orderBy: { startDate: 'asc' },
  }),
  ['tournaments-list', 'admin'],
  { tags: ['tournaments-list'] },
)

const getTournamentsPublic = unstable_cache(
  () => prisma.tournament.findMany({
    where: { deletedAt: null, isPublished: true, status: { not: 'DRAFT' } },
    select: TOURNAMENT_SELECT,
    orderBy: { startDate: 'asc' },
  }),
  ['tournaments-list', 'public'],
  { tags: ['tournaments-list'] },
)

export default async function TournamentsPage({ searchParams }: Props) {
  const user = await requireUser()
  const { tab } = await searchParams

  const tournaments = await (user.role === 'ADMIN' ? getTournamentsAdmin() : getTournamentsPublic())

  const counts = {
    all:       tournaments.length,
    ongoing:   tournaments.filter((t) => t.status === 'ONGOING').length,
    upcoming:  tournaments.filter((t) => t.status === 'UPCOMING').length,
    completed: tournaments.filter((t) => t.status === 'COMPLETED').length,
    draft:     tournaments.filter((t) => t.status === 'DRAFT').length,
  }

  const defaultTab =
    counts.ongoing > 0   ? 'ongoing' :
    counts.upcoming > 0  ? 'upcoming' :
    counts.completed > 0 ? 'completed' : 'all'

  const activeTab = tab && ['all', 'ongoing', 'upcoming', 'completed', 'draft'].includes(tab)
    ? tab
    : defaultTab

  const tabs = [
    { value: 'all',       label: 'All',       count: counts.all },
    { value: 'ongoing',   label: 'Ongoing',   count: counts.ongoing },
    { value: 'upcoming',  label: 'Upcoming',  count: counts.upcoming },
    { value: 'completed', label: 'Completed', count: counts.completed },
    ...(user.role === 'ADMIN' ? [{ value: 'draft', label: 'Draft', count: counts.draft }] : []),
  ]

  // Serialize dates for client
  const serialized = tournaments.map((t) => ({
    ...t,
    startDate: new Date(t.startDate).toISOString(),
    endDate: new Date(t.endDate).toISOString(),
  }))

  return (
    <div className="flex flex-col gap-[18px]">

      {/* Page head */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="font-bold tracking-[.2px]"
            style={{
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontSize: 22,
              color: 'var(--foreground)',
            }}
          >
            Tournaments
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 3 }}>
            All tournaments across the platform.
          </p>
        </div>

        {user.role === 'ADMIN' && (
          <Link
            href="/tournaments/new"
            className="no-underline flex items-center gap-[6px] transition-all duration-200"
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: 'var(--accent-clr)',
              color: '#000',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              letterSpacing: '0.2px',
            }}
          >
            + Create Tournament
          </Link>
        )}
      </div>

      {/* Empty state */}
      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center gap-3" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 36, opacity: 0.3 }}>🏆</span>
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No tournaments available yet.</span>
          {user.role === 'ADMIN' && (
            <Link
              href="/tournaments/new"
              className="no-underline"
              style={{
                marginTop: 4,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--muted-foreground)',
              }}
            >
              Create your first tournament
            </Link>
          )}
        </div>
      ) : (
        <TournamentsList
          tournaments={serialized}
          tabs={tabs}
          activeTab={activeTab}
          showDraft={user.role === 'ADMIN'}
        />
      )}
    </div>
  )
}
