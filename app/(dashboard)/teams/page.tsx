import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TeamCard } from '@/components/teams/team-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

export const metadata = { title: 'Teams — Forvado' }

interface Props {
  searchParams: Promise<{ q?: string; accepting?: string }>
}

export default async function TeamsPage({ searchParams }: Props) {
  const user = await requireUser()
  const { q, accepting } = await searchParams

  const where = {
    deletedAt: null as null,
    ...(accepting === 'true' && { isAcceptingRequests: true }),
    ...(q && { name: { contains: q, mode: 'insensitive' as const } }),
  }

  const teams = await prisma.team.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: {
      owner: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { members: true } },
    },
  })

  const canCreateTeam = ['PLAYER', 'TEAM_OWNER', 'ADMIN'].includes(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Browse and join football teams.</p>
        </div>
        {canCreateTeam && (
          <Button asChild size="sm" className="gap-2">
            <Link href="/teams/new"><Plus className="h-4 w-4" />New Team</Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <form method="GET" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search teams…" className="pl-9" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            name="accepting"
            value="true"
            defaultChecked={accepting === 'true'}
            className="accent-primary h-4 w-4"
          />
          Open to join
        </label>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
      </form>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground text-sm">No teams found.</p>
          {canCreateTeam && (
            <Button asChild size="sm" variant="outline">
              <Link href="/teams/new">Create the first one</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}
