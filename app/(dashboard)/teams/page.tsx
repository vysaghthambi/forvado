import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Teams — Forvado' }

export default async function TeamsPage() {
  const user = await requireUser()

  const canCreateTeam = user.role === 'ADMIN' || user.role === 'TEAM_OWNER'

  // My teams — teams where user is a member
  const myMemberships = await prisma.teamMembership.findMany({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  })

  // Compute match stats per team
  const myTeamIds = myMemberships.map((m) => m.teamId)
  const completedMatches = myTeamIds.length > 0
    ? await prisma.match.findMany({
        where: {
          status: 'COMPLETED',
          OR: [
            { homeTeamId: { in: myTeamIds } },
            { awayTeamId: { in: myTeamIds } },
          ],
        },
        select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
      })
    : []

  type Stats = { played: number; won: number; goals: number }
  const statsMap = new Map<string, Stats>()
  for (const id of myTeamIds) statsMap.set(id, { played: 0, won: 0, goals: 0 })

  for (const m of completedMatches) {
    const home = statsMap.get(m.homeTeamId)
    const away = statsMap.get(m.awayTeamId)
    if (home) { home.played++; home.goals += m.homeScore; if (m.homeScore > m.awayScore) home.won++ }
    if (away) { away.played++; away.goals += m.awayScore; if (m.awayScore > m.homeScore) away.won++ }
  }

  const myTeams = myMemberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    homeColour: m.team.homeColour,
    memberCount: m.team._count.members,
    stats: statsMap.get(m.teamId) ?? { played: 0, won: 0, goals: 0 },
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0,
          }}>
            Teams
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 3 }}>
            Teams you&apos;re part of, and discover new ones.
          </p>
        </div>
        {canCreateTeam && (
          <Link
            href="/teams/new"
            className="no-underline"
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--accent-clr)', color: '#000',
              fontSize: 13, fontWeight: 600,
            }}
          >
            + Create Team
          </Link>
        )}
      </div>

      {/* ── My Teams ── */}
      <div>
        <SectionLabel>My Teams</SectionLabel>
        {myTeams.length === 0 ? (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '36px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, opacity: 0.35, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 12, color: 'var(--muted-clr)' }}>You&apos;re not in any team yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myTeams.map((team) => {
              const colour = team.homeColour ?? '#2d3050'
              const bg = colour + '33'
              const initials = team.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

              return (
                <Link key={team.id} href={`/teams/${team.id}`} className="no-underline group">
                  <div
                    className="group-hover:border-border3 group-hover:-translate-y-px group-hover:shadow-[0_4px_24px_rgba(0,0,0,.5)] transition-all"
                    style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '16px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    {/* Badge */}
                    <div style={{
                      width: 58, height: 58, borderRadius: 13, flexShrink: 0,
                      background: bg, border: `1px solid ${colour}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                      fontSize: 18, fontWeight: 800, color: colour,
                    }}>
                      {initials}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                        fontSize: 16, fontWeight: 700, color: 'var(--text)',
                      }} className="truncate">
                        {team.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>
                        {team.memberCount} player{team.memberCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1, background: 'var(--border)',
                      borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                    }}>
                      {[
                        { v: team.stats.played, l: 'Played', color: 'var(--text)' },
                        { v: team.stats.won, l: 'Won', color: 'var(--green)' },
                        { v: team.stats.goals, l: 'Goals', color: 'var(--accent-clr)' },
                      ].map(({ v, l, color }) => (
                        <div key={l} style={{ background: 'var(--card2, #1d2035)', padding: '7px 12px', textAlign: 'center' }}>
                          <div style={{
                            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                            fontSize: 17, fontWeight: 700, color,
                          }}>{v}</div>
                          <div style={{ fontSize: 9, color: 'var(--muted-clr)', textTransform: 'uppercase', marginTop: 1 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
      fontSize: 11, fontWeight: 700, color: 'var(--muted-clr)',
      textTransform: 'uppercase', letterSpacing: '0.8px',
      marginBottom: 10,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}
