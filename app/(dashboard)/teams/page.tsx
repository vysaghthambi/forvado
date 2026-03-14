import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TeamCard } from '@/components/teams/team-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Build filter chip hrefs preserving the q param
  const allHref = q ? `/teams?q=${encodeURIComponent(q)}` : '/teams'
  const openHref = q
    ? `/teams?q=${encodeURIComponent(q)}&accepting=true`
    : '/teams?accepting=true'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Teams</h1>
        {canCreateTeam && (
          <Button asChild size="sm" className="gap-2">
            <Link href="/teams/new">
              <Plus className="h-4 w-4" />New Team
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <form method="GET" className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search teams…" className="pl-9" />
          {accepting === 'true' && (
            <input type="hidden" name="accepting" value="true" />
          )}
        </div>
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      {/* Filter chips */}
      <div className="flex gap-2">
        <Link
          href={allHref}
          className={cn(
            'inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
            accepting !== 'true'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
          )}
        >
          All teams
        </Link>
        <Link
          href={openHref}
          className={cn(
            'inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
            accepting === 'true'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
          )}
        >
          Open to join
        </Link>
      </div>

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
