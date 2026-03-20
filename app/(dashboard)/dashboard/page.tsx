import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LiveMatchesWidget } from '@/components/matches/live-matches-widget'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, isToday, isTomorrow } from 'date-fns'

export const metadata = { title: 'Dashboard — Forvado' }

const FORMAT_LABEL: Record<string, string> = {
  LEAGUE: 'League',
  KNOCKOUT: 'Knockout',
  GROUP_KNOCKOUT: 'Group + KO',
}

const STATUS_TAG: Record<string, { label: string; color: string; bg: string }> = {
  ONGOING:      { label: 'Ongoing',      color: '#f5c842', bg: 'rgba(245,200,66,.12)' },
  REGISTRATION: { label: 'Registration', color: '#3d8eff', bg: 'rgba(61,142,255,.12)' },
  UPCOMING:     { label: 'Upcoming',     color: '#ff6b35', bg: 'rgba(255,107,53,.10)' },
  COMPLETED:    { label: 'Completed',    color: '#5e6280', bg: 'rgba(94,98,128,.15)'  },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fixtureDateLabel(date: Date) {
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`
  return format(date, 'MMM d · h:mm a')
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
      select: {
        id: true,
        name: true,
        status: true,
        format: true,
        _count: { select: { teams: true } },
      },
      orderBy: { startDate: 'asc' },
      take: 8,
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
      take: 6,
    }),
  ])

  const greeting = getGreeting()
  const firstName = user.displayName.split(' ')[0]

  return (
    <div className="flex flex-col gap-[18px]">

      {/* ── Page Head ─────────────────────────────────────────────────── */}
      <div>
        <h1
          className="font-bold tracking-[.2px]"
          style={{
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            fontSize: 22,
            color: 'var(--foreground)',
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 3 }}>
          {greeting}, {firstName} — here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* ── grid2a: 1fr | 340px (wireframe) ──────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_340px]">

        {/* LEFT — Active Tournaments card */}
        <div
          className="overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between gap-2 flex-wrap"
            style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.5px',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
              }}
            >
              Active Tournaments
            </span>
            <Link
              href="/tournaments"
              className="no-underline transition-colors"
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid var(--border)',
                color: 'var(--muted-foreground)',
              }}
            >
              View All →
            </Link>
          </div>

          {/* List rows */}
          {tournaments.length === 0 ? (
            <div className="flex flex-col items-center gap-2" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <span style={{ fontSize: 28, opacity: 0.35 }}>🏆</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No active tournaments.</span>
            </div>
          ) : (
            tournaments.map((t, i) => {
              const tag = STATUS_TAG[t.status]
              return (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="no-underline block group">
                  <div
                    className="flex items-center gap-3 group-hover:bg-white/[0.025] transition-colors"
                    style={{
                      padding: '12px 15px',
                      borderBottom: i === tournaments.length - 1 ? 'none' : '1px solid rgba(35,38,56,.5)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                        {FORMAT_LABEL[t.format] ?? t.format} · {t._count.teams} team{t._count.teams !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {tag && (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 5,
                          fontSize: 10,
                          fontWeight: 600,
                          color: tag.color,
                          background: tag.bg,
                          flexShrink: 0,
                        }}
                      >
                        {tag.label}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* RIGHT — Live Matches + sidebar cards */}
        <div className="flex flex-col gap-4">

          {/* Live Matches widget */}
          <LiveMatchesWidget />

          {/* Upcoming Fixtures */}
          {upcomingMatches.length > 0 && (
            <div
              className="overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
            >
              <div
                className="flex items-center justify-between gap-2"
                style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '.5px',
                    textTransform: 'uppercase',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Upcoming Fixtures
                </span>
                <Link
                  href="/tournaments"
                  className="no-underline flex items-center gap-1 transition-colors"
                  style={{ fontSize: 11, color: 'var(--muted-foreground)' }}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div>
                {upcomingMatches.map((m, i) => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="no-underline block group">
                    <div
                      className="group-hover:bg-white/[0.025] transition-colors"
                      style={{
                        padding: '12px 15px',
                        borderBottom: i === upcomingMatches.length - 1 ? 'none' : '1px solid rgba(35,38,56,.5)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--muted-foreground)',
                          textTransform: 'uppercase',
                          letterSpacing: '.4px',
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        {fixtureDateLabel(new Date(m.scheduledAt))}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>
                        {m.homeTeam.name}{' '}
                        <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>vs</span>{' '}
                        {m.awayTeam.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>
                        {m.tournament.name}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Your Teams */}
          {memberships.length > 0 && (
            <div
              className="overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
            >
              <div
                className="flex items-center justify-between gap-2"
                style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '.5px',
                    textTransform: 'uppercase',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Your Teams
                </span>
                <Link
                  href="/teams"
                  className="no-underline flex items-center gap-1 transition-colors"
                  style={{ fontSize: 11, color: 'var(--muted-foreground)' }}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {memberships.map(({ team }) => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="no-underline">
                    <div
                      className="flex items-center gap-2 group transition-colors"
                      style={{
                        padding: '5px 12px 5px 6px',
                        borderRadius: 99,
                        border: '1px solid var(--border)',
                        background: 'var(--secondary)',
                      }}
                    >
                      <Avatar className="h-6 w-6 rounded-full">
                        <AvatarImage src={team.badgeUrl ?? ''} />
                        <AvatarFallback
                          className="text-[10px] font-bold rounded-full"
                          style={team.homeColour ? { background: team.homeColour, color: '#fff' } : undefined}
                        >
                          {team.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>
                        {team.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
