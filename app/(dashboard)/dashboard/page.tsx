import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'Dashboard — Forvado' }

const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Player',
  TEAM_OWNER: 'Team Owner',
  COORDINATOR: 'Tournament Coordinator',
  ADMIN: 'Administrator',
}

export default async function DashboardPage() {
  const user = await requireUser()

  const [memberships, tournaments] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { team: { select: { id: true, name: true, badgeUrl: true } } },
      take: 3,
    }),
    prisma.tournament.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        status: { in: ['ONGOING', 'REGISTRATION', 'UPCOMING'] },
      },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        _count: { select: { teams: true, matches: true } },
      },
      orderBy: { startDate: 'asc' },
      take: 3,
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
          </div>
          {user.position && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Position</span>
              <span>{user.position}</span>
            </div>
          )}
          {user.jerseyNumber && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Jersey Number</span>
              <span>#{user.jerseyNumber}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {memberships.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Your Teams</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/teams">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {memberships.map(({ team }) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Badge variant="secondary" className="text-sm px-3 py-1">{team.name}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tournaments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Tournaments</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/tournaments">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </div>
      )}
    </div>
  )
}
