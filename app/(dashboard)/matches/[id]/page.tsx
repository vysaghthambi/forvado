import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { canManageTournament } from '@/services/tournaments'
import { MatchScoreHero } from '@/components/matches/match-score-hero'
import { PenaltyTracker } from '@/components/matches/penalty-tracker'
import Link from 'next/link'
import { format } from 'date-fns'
import { unstable_cache } from 'next/cache'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const m = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
  })
  return { title: m ? `${m.homeTeam.name} vs ${m.awayTeam.name} — Forvado` : 'Match — Forvado' }
}

type Props = { params: Promise<{ id: string }> }

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']

function sortPlayers<T extends { position: string; jerseyNumber: number }>(players: T[]) {
  return [...players].sort((a, b) => {
    const pi = POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
    return pi !== 0 ? pi : a.jerseyNumber - b.jerseyNumber
  })
}

type MatchEventStat = { type: string; minute: number; primaryUser: { id: string } | null; secondaryUser: { id: string } | null }

function getPlayerStats(userId: string, events: MatchEventStat[]) {
  let goals = 0, ownGoals = 0, assists = 0, yellowCards = 0, redCard = false
  let subbedOff: number | null = null, subbedOn: number | null = null

  for (const e of events) {
    if (e.primaryUser?.id === userId) {
      if (e.type === 'GOAL' || e.type === 'EXTRA_TIME_GOAL') goals++
      if (e.type === 'OWN_GOAL') ownGoals++
      if (e.type === 'YELLOW_CARD' || e.type === 'SECOND_YELLOW') yellowCards++
      if (e.type === 'RED_CARD' || e.type === 'SECOND_YELLOW') redCard = true
      if (e.type === 'SUBSTITUTION') subbedOff = e.minute
    }
    if (e.secondaryUser?.id === userId) {
      if (e.type === 'GOAL' || e.type === 'EXTRA_TIME_GOAL') assists++
      if (e.type === 'SUBSTITUTION') subbedOn = e.minute
    }
  }
  return { goals, ownGoals, assists, yellowCards, redCard, subbedOff, subbedOn }
}

function PlayerStatCell({ userId, events }: { userId: string; events: MatchEventStat[] }) {
  const s = getPlayerStats(userId, events)
  const parts: React.ReactNode[] = []
  if (s.goals > 0) parts.push(<span key="g" style={{ fontSize: 10, color: 'var(--green)' }}>{'⚽'.repeat(Math.min(s.goals, 3))}</span>)
  if (s.ownGoals > 0) parts.push(<span key="og" style={{ fontSize: 10, color: 'var(--live)' }}>⚽(OG)</span>)
  if (s.assists > 0) parts.push(<span key="a" style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 700 }}>A</span>)
  if (s.yellowCards > 0) parts.push(<span key="y" style={{ fontSize: 11 }}>{'🟨'.repeat(Math.min(s.yellowCards, 2))}</span>)
  if (s.redCard) parts.push(<span key="r" style={{ fontSize: 11 }}>🟥</span>)
  if (s.subbedOff !== null) parts.push(<span key="so" style={{ fontSize: 10, color: 'var(--muted-clr)' }}>↔ {s.subbedOff}&apos;</span>)
  if (s.subbedOn !== null) parts.push(<span key="si" style={{ fontSize: 10, color: 'var(--green)' }}>↔ {s.subbedOn}&apos;</span>)
  if (parts.length === 0) return <span style={{ color: 'var(--muted-clr)' }}>—</span>
  return <div style={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>{parts}</div>
}

const thStyle: React.CSSProperties = {
  padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
  color: 'var(--muted-clr)', textTransform: 'uppercase', letterSpacing: '0.5px',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 12, color: 'var(--text)', borderBottom: '1px solid var(--border)',
}

function getMatchData(id: string) {
  return unstable_cache(
    () => prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { select: { id: true, name: true, homeColour: true, shortCode: true } },
        awayTeam: { select: { id: true, name: true, homeColour: true, shortCode: true } },
        tournament: { select: { id: true, name: true } },
        playerOfMatch: { select: { id: true, displayName: true } },
        group: { select: { id: true, name: true } },
        events: {
          include: {
            primaryUser: { select: { id: true, displayName: true } },
            secondaryUser: { select: { id: true, displayName: true } },
            team: { select: { id: true, name: true } },
          },
          orderBy: { minute: 'asc' },
        },
        lineups: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
            team: { select: { id: true, name: true } },
          },
          orderBy: [{ isSubstitute: 'asc' }, { jerseyNumber: 'asc' }],
        },
        penalties: {
          include: {
            user: { select: { id: true, displayName: true } },
            team: { select: { id: true, name: true } },
          },
          orderBy: [{ teamId: 'asc' }, { kickOrder: 'asc' }],
        },
      },
    }),
    ['match-detail', id],
    { tags: [`match-${id}`] },
  )()
}

export default async function MatchPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const match = await getMatchData(id)

  if (!match) notFound()

  const canManage = await canManageTournament(match.tournamentId, user.id, user.role)

  const hasPenalties = match.status === 'PENALTY_SHOOTOUT' || match.penalties.length > 0
  const hasLineups = match.lineups.length > 0

  const homeLineups = match.lineups.filter((l) => l.teamId === match.homeTeamId)
  const awayLineups = match.lineups.filter((l) => l.teamId === match.awayTeamId)

  const homeStarters = sortPlayers(homeLineups.filter((l) => !l.isSubstitute).map((l) => ({
    ...l, position: l.position ?? 'MID',
  })))
  const homeSubs = sortPlayers(homeLineups.filter((l) => l.isSubstitute).map((l) => ({
    ...l, position: l.position ?? 'MID',
  })))
  const awayStarters = sortPlayers(awayLineups.filter((l) => !l.isSubstitute).map((l) => ({
    ...l, position: l.position ?? 'MID',
  })))
  const awaySubs = sortPlayers(awayLineups.filter((l) => l.isSubstitute).map((l) => ({
    ...l, position: l.position ?? 'MID',
  })))

  const penaltyPlayers = match.lineups.map((l) => ({
    id: l.userId,
    displayName: l.user.displayName,
    jerseyNumber: l.jerseyNumber,
    teamId: l.teamId,
  }))

  // Team colour for lineup dot
  const homeFg = '#7ab4ff'
  const awayFg = '#2ddb7f'

  const sectionLbl: React.CSSProperties = {
    padding: '10px 14px 4px',
    fontSize: 10, fontWeight: 700, color: 'var(--muted-clr)',
    textTransform: 'uppercase', letterSpacing: '0.6px',
  }

  type EventRow = { type: string; minute: number; primaryUser: { id: string } | null; secondaryUser: { id: string } | null }

  function LineupTable({ players, teamFg, events }: {
    players: typeof homeStarters
    teamFg: string
    events: EventRow[]
  }) {
    if (players.length === 0) return null
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 30 }}>#</th>
            <th style={thStyle}>Player</th>
            <th style={thStyle}>Pos</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Stats</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ ...tdStyle, color: 'var(--muted-clr)', fontWeight: 600 }}>{p.jerseyNumber}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: teamFg, flexShrink: 0 }} />
                  {p.user.displayName}
                </div>
              </td>
              <td style={{ ...tdStyle, color: 'var(--muted-clr)' }}>{p.position}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <PlayerStatCell userId={p.userId} events={events} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-clr)' }}>
        <Link href="/tournaments" style={{ color: 'var(--text2)', textDecoration: 'none' }}>
          Tournaments
        </Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <Link href={`/tournaments/${match.tournamentId}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>
          {match.tournament.name}
        </Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>
          {match.homeTeam.name} vs {match.awayTeam.name}
        </span>
      </div>

      {/* Match Hero */}
      <MatchScoreHero
        initialMatch={{
          id: match.id,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homePenaltyScore: match.homePenaltyScore,
          awayPenaltyScore: match.awayPenaltyScore,
          matchTime: match.matchTime,
          firstHalfStartedAt: match.firstHalfStartedAt ? new Date(match.firstHalfStartedAt).toISOString() : null,
          halfTimeAt: match.halfTimeAt ? new Date(match.halfTimeAt).toISOString() : null,
          secondHalfStartedAt: match.secondHalfStartedAt ? new Date(match.secondHalfStartedAt).toISOString() : null,
          fullTimeAt: match.fullTimeAt ? new Date(match.fullTimeAt).toISOString() : null,
          etFirstHalfStartedAt: match.etFirstHalfStartedAt ? new Date(match.etFirstHalfStartedAt).toISOString() : null,
          etHalfTimeAt: match.etHalfTimeAt ? new Date(match.etHalfTimeAt).toISOString() : null,
          etSecondHalfStartedAt: match.etSecondHalfStartedAt ? new Date(match.etSecondHalfStartedAt).toISOString() : null,
          etFullTimeAt: match.etFullTimeAt ? new Date(match.etFullTimeAt).toISOString() : null,
          penaltyStartedAt: match.penaltyStartedAt ? new Date(match.penaltyStartedAt).toISOString() : null,
          completedAt: match.completedAt ? new Date(match.completedAt).toISOString() : null,
          venue: match.venue,
          scheduledAt: new Date(match.scheduledAt).toISOString(),
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          group: match.group,
          round: match.round,
        }}
        initialEvents={match.events}
        canManage={canManage}
      />

      {/* Player of the Match */}
      {match.playerOfMatch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 10,
          border: '1px solid rgba(245,200,66,.25)',
          background: 'rgba(245,200,66,.06)',
        }}>
          <span style={{ fontSize: 16 }}>⭐</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-clr)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Player of the Match
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
              {match.playerOfMatch.displayName}
            </div>
          </div>
        </div>
      )}

      {/* Lineups */}
      {hasLineups && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Home lineup */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text2)' }}>
                {match.homeTeam.name} — Lineup
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: match.homeTeam.homeColour ?? '#1e3a5f', border: `1px solid ${homeFg}` }} />
                <span style={{ fontSize: 11, color: 'var(--muted-clr)' }}>Home</span>
              </div>
            </div>
            {homeStarters.length > 0 && (
              <>
                <div style={sectionLbl}>Starting XI</div>
                <LineupTable players={homeStarters} teamFg={homeFg} events={match.events} />
              </>
            )}
            {homeSubs.length > 0 && (
              <>
                <div style={{ ...sectionLbl, borderTop: '1px solid var(--border)', marginTop: 4 }}>Substitutes</div>
                <LineupTable players={homeSubs} teamFg={'var(--border2)'} events={match.events} />
              </>
            )}
            {homeLineups.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--muted-clr)' }}>
                Lineup not submitted
              </div>
            )}
          </div>

          {/* Away lineup */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text2)' }}>
                {match.awayTeam.name} — Lineup
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: match.awayTeam.homeColour ?? '#1a2e1a', border: `1px solid ${awayFg}` }} />
                <span style={{ fontSize: 11, color: 'var(--muted-clr)' }}>Away</span>
              </div>
            </div>
            {awayStarters.length > 0 && (
              <>
                <div style={sectionLbl}>Starting XI</div>
                <LineupTable players={awayStarters} teamFg={awayFg} events={match.events} />
              </>
            )}
            {awaySubs.length > 0 && (
              <>
                <div style={{ ...sectionLbl, borderTop: '1px solid var(--border)', marginTop: 4 }}>Substitutes</div>
                <LineupTable players={awaySubs} teamFg={'var(--border2)'} events={match.events} />
              </>
            )}
            {awayLineups.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--muted-clr)' }}>
                Lineup not submitted
              </div>
            )}
          </div>
        </div>
      )}

      {/* Penalty Shootout */}
      {hasPenalties && (
        <div>
          <PenaltyTracker
            matchId={id}
            status={match.status}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            players={penaltyPlayers}
            initialKicks={match.penalties}
            canEdit={false}
          />
        </div>
      )}

      {/* Match info footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 8,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        fontSize: 11, color: 'var(--muted-clr)', flexWrap: 'wrap', gap: 8,
      }}>
        <span>{format(new Date(match.scheduledAt), 'EEEE, MMMM d, yyyy · HH:mm')}</span>
        {match.venue && <span>📍 {match.venue}</span>}
        <Link href={`/tournaments/${match.tournamentId}`} style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: 11 }}>
          ← {match.tournament.name}
        </Link>
      </div>

    </div>
  )
}
