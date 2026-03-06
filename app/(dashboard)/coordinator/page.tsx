import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TournamentCard } from '@/components/tournaments/tournament-card'

export const metadata = { title: 'Coordinator Panel — Forvado' }

export default async function CoordinatorPage() {
  const user = await requireUser()
  if (user.role !== 'COORDINATOR' && user.role !== 'ADMIN') redirect('/dashboard')

  const assignments = await prisma.tournamentCoordinator.findMany({
    where: { userId: user.id },
    include: {
      tournament: {
        include: {
          createdBy: { select: { id: true, displayName: true } },
          _count: { select: { teams: true, matches: true } },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })

  const tournaments = assignments
    .map((a) => a.tournament)
    .filter((t) => t.deletedAt === null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coordinator Panel</h1>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-muted-foreground text-sm">No tournaments assigned to you yet.</p>
          <p className="text-xs text-muted-foreground">An admin will assign you to a tournament.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are assigned to {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </div>
      )}
    </div>
  )
}
