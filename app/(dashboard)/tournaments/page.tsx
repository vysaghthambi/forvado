import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const metadata = { title: 'Tournaments — Forvado' }

export default async function TournamentsPage() {
  const user = await requireUser()

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

  const ongoing = tournaments.filter((t) => t.status === 'ONGOING')
  const upcoming = tournaments.filter((t) => ['REGISTRATION', 'UPCOMING'].includes(t.status))
  const completed = tournaments.filter((t) => t.status === 'COMPLETED')
  const drafts = tournaments.filter((t) => t.status === 'DRAFT')

  function Section({ title, items }: { title: string; items: typeof tournaments }) {
    if (items.length === 0) return null
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => <TournamentCard key={t.id} tournament={t} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        {user.role === 'ADMIN' && (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/tournaments/new"><Plus className="h-4 w-4" />New Tournament</Link>
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
        <div className="space-y-8">
          <Section title="Ongoing" items={ongoing} />
          <Section title="Upcoming" items={upcoming} />
          <Section title="Completed" items={completed} />
          {user.role === 'ADMIN' && (
            <Section title="Drafts" items={drafts} />
          )}
        </div>
      )}
    </div>
  )
}
