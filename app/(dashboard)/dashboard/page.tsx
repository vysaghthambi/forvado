import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LiveMatchesWidget } from '@/components/matches/live-matches-widget'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, isToday, isTomorrow } from 'date-fns'

export const metadata = { title: 'Dashboard — Forvado' }

const STATUS_DOT: Record<string, string> = {
  ONGOING: 'bg-green-400',
  REGISTRATION: 'bg-amber-400',
  UPCOMING: 'bg-amber-400',
  COMPLETED: 'bg-muted-foreground',
}

const STATUS_LABEL: Record<string, string> = {
  ONGOING: 'Ongoing',
  REGISTRATION: 'Upcoming',
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fixtureDateLabel(date: Date) {
  if (isToday(date)) return `Today • ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow • ${format(date, 'h:mm a')}`
  return format(date, 'MMM d • h:mm a')
}

export default async function DashboardPage() {
  const user = await requireUser()

  const [memberships, tournaments, upcomingMatches] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { team: { select: { id: true, name: true, badgeUrl: true, homeColour: true } } },
      take: 5,
    }),
    prisma.tournament.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        status: { in: ['ONGOING', 'REGISTRATION', 'UPCOMING'] },
      },
      select: { id: true, name: true, status: true },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
    prisma.match.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
        tournament: { isPublished: true, deletedAt: null },
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        tournament: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
    }),
  ])

  const greeting = getGreeting()

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {user.displayName.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Live Now strip */}
      <LiveMatchesWidget />

      {/* Upcoming fixtures */}
      {upcomingMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Fixtures
            </h2>
            <Link
              href="/tournaments"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
            {upcomingMatches.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`} className="shrink-0">
                <div className="w-48 rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                    {fixtureDateLabel(new Date(m.scheduledAt))}
                  </p>
                  <p className="text-sm font-semibold leading-tight">
                    {m.homeTeam.name} vs {m.awayTeam.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {m.tournament.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Your Teams */}
      {memberships.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your Teams
            </h2>
            <Link
              href="/teams"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {memberships.map(({ team }) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card pl-1.5 pr-4 py-1.5 hover:border-primary/40 transition-colors">
                  <Avatar className="h-6 w-6 rounded-full">
                    <AvatarImage src={team.badgeUrl ?? ''} />
                    <AvatarFallback
                      className="text-[10px] font-bold rounded-full"
                      style={team.homeColour ? { background: team.homeColour, color: '#fff' } : undefined}
                    >
                      {team.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold">{team.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tournaments inline list */}
      {tournaments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tournaments
            </h2>
            <Link
              href="/tournaments"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
            {tournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`} className="block">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[t.status] ?? 'bg-muted-foreground'}`}
                  />
                  <span className="flex-1 text-sm font-medium truncate">{t.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
