import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Users, Trophy } from 'lucide-react'

export const metadata = { title: 'Admin Panel — Forvado' }

export default async function AdminPage() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') redirect('/dashboard')

  const [tournaments, userCount, teamCount] = await Promise.all([
    prisma.tournament.findMany({
      where: { deletedAt: null },
      include: { createdBy: { select: { id: true, displayName: true } }, _count: { select: { teams: true, matches: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.count(),
    prisma.team.count({ where: { deletedAt: null } }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/tournaments/new"><Plus className="h-4 w-4" />New Tournament</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Trophy className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{tournaments.length}</p>
            <p className="text-xs text-muted-foreground">Tournaments</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{userCount}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{teamCount}</p>
            <p className="text-xs text-muted-foreground">Teams</p>
          </div>
        </div>
      </div>

      {/* Tournaments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">All Tournaments</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tournaments">View all</Link>
          </Button>
        </div>
        {tournaments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tournaments yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
