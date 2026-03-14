import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { TournamentFilterTabs } from '@/components/tournaments/tournament-filter-tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'

export const metadata = { title: 'Tournaments — Forvado' }

type Props = { searchParams: Promise<{ tab?: string }> }

const TAB_STATUSES: Record<string, string[]> = {
  ongoing:   ['ONGOING'],
  upcoming:  ['REGISTRATION', 'UPCOMING'],
  completed: ['COMPLETED'],
  draft:     ['DRAFT'],
}

const TAB_LABELS: Record<string, string> = {
  ongoing:   '🔴 Ongoing',
  upcoming:  '🟡 Upcoming',
  completed: '✓ Completed',
  draft:     'Draft',
}

export default async function TournamentsPage({ searchParams }: Props) {
  const user = await requireUser()
  const { tab } = await searchParams

  const tournaments = await prisma.tournament.findMany({
    where: {
      deletedAt: null,
      ...(user.role !== 'ADMIN' ? { isPublished: true, status: { not: 'DRAFT' } } : {}),
    },
    include: {
      createdBy: { select: { id: true, displayName: true } },
      _count: { select: { teams: true, matches: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  const ongoing   = tournaments.filter((t) => t.status === 'ONGOING')
  const upcoming  = tournaments.filter((t) => ['REGISTRATION', 'UPCOMING'].includes(t.status))
  const completed = tournaments.filter((t) => t.status === 'COMPLETED')
  const drafts    = tournaments.filter((t) => t.status === 'DRAFT')

  // Default to first non-empty tab
  const defaultTab =
    ongoing.length > 0 ? 'ongoing' :
    upcoming.length > 0 ? 'upcoming' :
    completed.length > 0 ? 'completed' : 'ongoing'

  const activeTab = tab && TAB_STATUSES[tab] ? tab : defaultTab

  const tabs = [
    { value: 'ongoing',   label: TAB_LABELS.ongoing,   count: ongoing.length },
    { value: 'upcoming',  label: TAB_LABELS.upcoming,  count: upcoming.length },
    { value: 'completed', label: TAB_LABELS.completed, count: completed.length },
    ...(user.role === 'ADMIN' ? [{ value: 'draft', label: TAB_LABELS.draft, count: drafts.length }] : []),
  ]

  const visibleTournaments =
    activeTab === 'ongoing'   ? ongoing :
    activeTab === 'upcoming'  ? upcoming :
    activeTab === 'completed' ? completed :
    activeTab === 'draft'     ? drafts : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        {user.role === 'ADMIN' && (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/tournaments/new">
              <Plus className="h-4 w-4" />New Tournament
            </Link>
          </Button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-muted-foreground text-sm">No tournaments available yet.</p>
          {user.role === 'ADMIN' && (
            <Button asChild size="sm" variant="outline">
              <Link href="/tournaments/new">Create your first tournament</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <Suspense>
            <TournamentFilterTabs tabs={tabs} activeTab={activeTab} />
          </Suspense>

          {/* Tournament list */}
          {visibleTournaments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No {TAB_LABELS[activeTab]?.toLowerCase().replace(/[^a-z ]/g, '').trim()} tournaments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleTournaments.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
