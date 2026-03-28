import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { canManageTournament, autoUpdateTournamentStatus } from '@/services/tournaments'
import { computeLeagueStandings, computeGroupStandings } from '@/services/standings'
import { StandingsTable } from '@/components/tournaments/standings-table'
import { GroupStandingsTabs } from '@/components/tournaments/group-standings-tabs'
import { FixturesList } from '@/components/tournaments/fixtures-list'
import Link from 'next/link'
import { format } from 'date-fns'
import { FORMAT_LABEL, TOURNAMENT_STATUS_TAG } from '@/lib/labels'
import { unstable_cache } from 'next/cache'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [tournament] = await getTournamentDetailData(id)
  return { title: tournament ? `${tournament.name} — Forvado` : 'Tournament — Forvado' }
}


const COMPLETED_STATUSES = new Set(['COMPLETED', 'FULL_TIME', 'EXTRA_TIME_FULL_TIME'])
const LIVE_STATUSES = new Set([
  'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF',
  'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF',
  'PENALTY_SHOOTOUT',
])

type Props = { params: Promise<{ id: string }> }

function getTournamentDetailData(id: string) {
  return unstable_cache(
    () => Promise.all([
      prisma.tournament.findUnique({
        where: { id, deletedAt: null },
        include: {
          teams: {
            include: {
              team: { select: { id: true, name: true, badgeUrl: true, homeColour: true, shortCode: true } },
              group: { select: { id: true, name: true } },
            },
            orderBy: { registeredAt: 'asc' },
          },
          groups: { orderBy: { name: 'asc' } },
          coordinators: { include: { user: { select: { id: true, displayName: true } } } },
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true, badgeUrl: true, homeColour: true, shortCode: true } },
              awayTeam: { select: { id: true, name: true, badgeUrl: true, homeColour: true, shortCode: true } },
              group: { select: { id: true, name: true } },
            },
            orderBy: { matchOrder: 'asc' },
          },
        },
      }),
      prisma.matchEvent.findMany({
        where: {
          match: { tournamentId: id },
          type: { in: ['GOAL', 'OWN_GOAL', 'EXTRA_TIME_GOAL'] },
          primaryUserId: { not: null },
        },
        include: {
          primaryUser: { select: { id: true, displayName: true } },
          team: { select: { id: true, name: true, homeColour: true } },
        },
      }),
      prisma.matchEvent.findMany({
        where: {
          match: { tournamentId: id },
          type: { in: ['YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW'] },
          primaryUserId: { not: null },
        },
        include: {
          primaryUser: { select: { id: true, displayName: true } },
          team: { select: { id: true, name: true, homeColour: true } },
        },
      }),
      prisma.match.findMany({
        where: { tournamentId: id, playerOfMatchId: { not: null } },
        select: {
          playerOfMatch: { select: { id: true, displayName: true } },
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      }),
    ]),
    ['tournament-detail', id],
    { tags: [`tournament-${id}`] },
  )()
}

export default async function TournamentDetailPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  // Fetch tournament data and check manage permission in parallel
  const [[tournament, goalEvents, cardEvents, potmMatches], canManage] = await Promise.all([
    getTournamentDetailData(id),
    canManageTournament(id, user.id, user.role),
  ])

  if (!tournament) notFound()
  if (!tournament.isPublished && !canManage) notFound()

  // Status update needs tournament data; standings computed from already-fetched data (no extra DB query)
  const currentStatus = await autoUpdateTournamentStatus(id, tournament)

  const leagueRows = tournament.format === 'LEAGUE'
    ? computeLeagueStandings(tournament.teams, tournament.matches)
    : null
  const groupStandings = tournament.format === 'GROUP_KNOCKOUT'
    ? computeGroupStandings(tournament.groups, tournament.teams, tournament.matches)
    : null
  const showStandings = tournament.format === 'LEAGUE' || tournament.format === 'GROUP_KNOCKOUT'

  // Stat strip
  const played = tournament.matches.filter((m) => COMPLETED_STATUSES.has(m.status) || LIVE_STATUSES.has(m.status)).length
  const remaining = tournament.matches.filter((m) => m.status === 'SCHEDULED').length
  const goals = tournament.matches.reduce((s, m) => s + m.homeScore + m.awayScore, 0)
  const teamCount = tournament.teams.length

  // Top goal scorers
  const scorerMap = new Map<string, { id: string; name: string; team: string; teamColour: string | null; goals: number }>()
  for (const e of goalEvents) {
    if (!e.primaryUser) continue
    const key = e.primaryUser.id
    if (!scorerMap.has(key)) scorerMap.set(key, { id: key, name: e.primaryUser.displayName, team: e.team.name, teamColour: e.team.homeColour, goals: 0 })
    scorerMap.get(key)!.goals++
  }
  const topScorers = [...scorerMap.values()].sort((a, b) => b.goals - a.goals).slice(0, 5)
  const maxGoals = topScorers[0]?.goals ?? 1

  // POTM awards
  const potmMap = new Map<string, { id: string; name: string; count: number }>()
  for (const m of potmMatches) {
    if (!m.playerOfMatch) continue
    const key = m.playerOfMatch.id
    if (!potmMap.has(key)) potmMap.set(key, { id: key, name: m.playerOfMatch.displayName, count: 0 })
    potmMap.get(key)!.count++
  }
  const potmList = [...potmMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)

  // Discipline
  const yellowMap = new Map<string, { id: string; name: string; team: string; teamColour: string | null; count: number }>()
  const redMap = new Map<string, { id: string; name: string; team: string; teamColour: string | null; count: number }>()
  for (const e of cardEvents) {
    if (!e.primaryUser) continue
    const key = e.primaryUser.id
    const target = (e.type === 'YELLOW_CARD') ? yellowMap : redMap
    if (!target.has(key)) target.set(key, { id: key, name: e.primaryUser.displayName, team: e.team.name, teamColour: e.team.homeColour, count: 0 })
    target.get(key)!.count++
  }
  const topYellow = [...yellowMap.values()].sort((a, b) => b.count - a.count).slice(0, 3)
  const topRed = [...redMap.values()].sort((a, b) => b.count - a.count).slice(0, 3)

  // Recent matches — live first, then last 5 completed, then upcoming
  const liveMatches = tournament.matches.filter((m) => LIVE_STATUSES.has(m.status))
  const doneMatches = tournament.matches.filter((m) => COMPLETED_STATUSES.has(m.status)).slice(-4)
  const recentMatches = [...liveMatches, ...doneMatches].slice(0, 5)

  // Hero
  const initials = tournament.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const dateRange = `${format(new Date(tournament.startDate), 'MMM d')} – ${format(new Date(tournament.endDate), 'MMM d, yyyy')}`
  const tag = TOURNAMENT_STATUS_TAG[currentStatus]

  const rankColors = ['var(--accent-clr)', '#b0b8d0', '#cd7f32']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-clr)' }}>
        <Link href="/tournaments" className="no-underline transition-colors" style={{ color: 'var(--muted-clr)' }}>Tournaments</Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>{tournament.name}</span>
      </div>

      {/* ── Hero ─────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0c1322 0%,#12102a 60%,#0f1510 100%)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '22px 22px 0', display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>

          <div style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0, background: 'var(--accent-dim)', color: 'var(--accent-clr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 22, fontWeight: 800 }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '0.2px', color: 'var(--text)', margin: 0 }}>
                {tournament.name}
              </h1>
              {tag && <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, color: tag.color, background: tag.bg }}>{tag.label}</span>}
              {!tournament.isPublished && currentStatus !== 'DRAFT' && (
                <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, color: 'var(--orange)', background: 'var(--orange-dim)', border: '1px solid var(--orange)' }}>Unpublished</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 4 }}>
              {FORMAT_LABEL[tournament.format] ?? tournament.format}
              {tournament.venue ? ` · ${tournament.venue}` : ''}
              {` · ${dateRange}`}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <MetaTag color="var(--blue)" bg="var(--blue-dim)">{teamCount} Teams</MetaTag>
              <MetaTag color="var(--green)" bg="var(--green-dim)">{tournament.matchTime} min</MetaTag>
              <MetaTag color="var(--muted-clr)" bg="rgba(94,98,128,.12)">{tournament.playingMembers} players</MetaTag>
              <MetaTag color="var(--muted-clr)" bg="rgba(94,98,128,.12)">{tournament.maxSubstitutes} subs</MetaTag>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignSelf: 'flex-start', paddingTop: 4 }}>
            {canManage && (
              <Link href={`/tournaments/${id}/manage`} className="no-underline" style={{ padding: '6px 13px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg3)', fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                ⚙ Manage
              </Link>
            )}
            <Link href={`/tournaments/${id}/fixtures`} className="no-underline" style={{ padding: '6px 13px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg3)', fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
              All Fixtures →
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--border)', marginTop: 20 }}>
          {[{ v: played, l: 'Played' }, { v: remaining, l: 'Remaining' }, { v: goals, l: 'Goals' }, { v: teamCount, l: 'Teams' }].map(({ v, l }) => (
            <div key={l} style={{ background: 'var(--card)', padding: 13, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--muted-clr)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Standings ──────────────────────────── */}
      {showStandings && (
        <>
          {tournament.format === 'LEAGUE' && leagueRows && <StandingsTable rows={leagueRows} title="Standings" />}
          {tournament.format === 'GROUP_KNOCKOUT' && groupStandings && (
            <GroupStandingsTabs groups={groupStandings} />
          )}
        </>
      )}

      {/* ── Stats + Matches grid ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top Goal Scorers */}
          <Card title="Top Goal Scorers" aside={<span style={{ fontSize: 10, color: 'var(--muted-clr)' }}>All groups</span>}>
            {topScorers.length === 0 ? (
              <EmptyState icon="⚽" text="No goals recorded yet." />
            ) : (
              <div>
                {topScorers.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', borderBottom: i < topScorers.length - 1 ? '1px solid rgba(35,38,56,.5)' : 'none' }}>
                    <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, color: rankColors[i] ?? 'var(--muted-clr)', width: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <PlayerBadge name={s.name} colour={s.teamColour} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }} className="truncate">{s.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted-clr)', marginTop: 1 }} className="truncate">{s.team}</div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, borderRadius: 2, background: 'var(--bg3)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(s.goals / maxGoals) * 100}%`, background: rankColors[i] ?? 'var(--muted-clr)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, color: rankColors[i] ?? 'var(--muted-clr)', minWidth: 18, textAlign: 'right' }}>{s.goals}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Player of the Match Awards */}
          <Card title="Player of the Match" aside={<span style={{ fontSize: 10, color: 'var(--muted-clr)' }}>Most awarded</span>}>
            {potmList.length === 0 ? (
              <EmptyState icon="🏅" text="No awards yet." />
            ) : (
              <div>
                {potmList.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', borderBottom: i < potmList.length - 1 ? '1px solid rgba(35,38,56,.5)' : 'none' }}>
                    <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, color: rankColors[i] ?? 'var(--muted-clr)', width: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <PlayerBadge name={p.name} colour={null} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }} className="truncate">{p.name}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, color: rankColors[i] ?? 'var(--muted-clr)' }}>{p.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Discipline */}
          <Card title="Discipline">
            {topYellow.length === 0 && topRed.length === 0 ? (
              <EmptyState icon="🟨" text="No cards recorded yet." />
            ) : (
              <div>
                {topYellow.length > 0 && (
                  <>
                    <div style={{ padding: '8px 15px 6px', fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted-clr)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
                      Most Yellow Cards
                    </div>
                    {topYellow.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 15px', borderBottom: '1px solid rgba(35,38,56,.5)' }}>
                        <span style={{ fontSize: 14 }}>🟨</span>
                        <PlayerBadge name={p.name} colour={p.teamColour} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }} className="truncate">{p.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted-clr)' }}>{p.team}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--accent-clr)' }}>{p.count}</span>
                      </div>
                    ))}
                  </>
                )}
                {topRed.length > 0 && (
                  <>
                    <div style={{ padding: '8px 15px 6px', fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted-clr)', textTransform: 'uppercase', letterSpacing: '.6px', borderTop: topYellow.length > 0 ? '1px solid var(--border)' : 'none', marginTop: topYellow.length > 0 ? 4 : 0 }}>
                      Red Cards
                    </div>
                    {topRed.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 15px', borderBottom: i < topRed.length - 1 ? '1px solid rgba(35,38,56,.5)' : 'none' }}>
                        <span style={{ fontSize: 14 }}>🟥</span>
                        <PlayerBadge name={p.name} colour={p.teamColour} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }} className="truncate">{p.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted-clr)' }}>{p.team}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--live)' }}>{p.count}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Recent Matches */}
          <Card
            title="Recent Matches"
            aside={
              <Link href={`/tournaments/${id}/fixtures`} className="no-underline" style={{ fontSize: 11, color: 'var(--muted-clr)' }}>
                All Fixtures →
              </Link>
            }
          >
            {recentMatches.length === 0 ? (
              <EmptyState icon="📅" text="No matches played yet." />
            ) : (
              <FixturesList matches={recentMatches} showGroup={tournament.format === 'GROUP_KNOCKOUT'} noGroup naked />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function MetaTag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, color, background: bg }}>
      {children}
    </span>
  )
}

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          {title}
        </span>
        {aside}
      </div>
      {children}
    </div>
  )
}

function PlayerBadge({ name, colour }: { name: string; colour: string | null | undefined }) {
  const c = colour ?? '#2d3050'
  return (
    <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: c + '33', border: `1px solid ${c}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 9, fontWeight: 700, color: c, letterSpacing: '0.5px' }}>
      {name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '28px 20px', textAlign: 'center' }}>
      <span style={{ fontSize: 24, opacity: 0.35 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{text}</span>
    </div>
  )
}
