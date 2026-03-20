import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { canManageTournament } from '@/services/tournaments'
import { MatchScoreHero } from '@/components/matches/match-score-hero'
import { PhaseControl } from '@/components/matches/phase-control'
import { EventLogger } from '@/components/matches/event-logger'
import { LineupPanel } from '@/components/matches/lineup-panel'
import { MatchTimeline } from '@/components/matches/match-timeline'
import { PenaltyTracker } from '@/components/matches/penalty-tracker'
import { PlayerOfMatch } from '@/components/matches/player-of-match'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export default async function MatchControlPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: {
        select: {
          id: true, name: true, homeColour: true,
          members: {
            where: { status: 'ACTIVE' },
            include: { user: { select: { id: true, displayName: true, avatarUrl: true, position: true, jerseyNumber: true } } },
          },
        },
      },
      awayTeam: {
        select: {
          id: true, name: true, homeColour: true,
          members: {
            where: { status: 'ACTIVE' },
            include: { user: { select: { id: true, displayName: true, avatarUrl: true, position: true, jerseyNumber: true } } },
          },
        },
      },
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
  })

  if (!match) notFound()
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) redirect(`/matches/${id}`)

  const homeMembers = match.homeTeam.members.map((m) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
    position: m.user.position,
    jerseyNumber: m.jerseyNumber ?? m.user.jerseyNumber,
  }))
  const awayMembers = match.awayTeam.members.map((m) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
    position: m.user.position,
    jerseyNumber: m.jerseyNumber ?? m.user.jerseyNumber,
  }))

  const allLineupPlayers = match.lineups.map((l) => ({
    id: l.userId,
    displayName: (
      homeMembers.find((m) => m.userId === l.userId) ??
      awayMembers.find((m) => m.userId === l.userId)
    )?.displayName ?? l.userId,
    jerseyNumber: l.jerseyNumber,
    isSubstitute: l.isSubstitute,
    position: l.position ?? 'MID',
    teamId: l.teamId,
  }))

  const isPSO = match.status === 'PENALTY_SHOOTOUT' || match.penalties.length > 0

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-clr)' }}>
        <Link href="/tournaments" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Tournaments</Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <Link href={`/tournaments/${match.tournamentId}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{match.tournament.name}</Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <Link href={`/matches/${id}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{match.homeTeam.name} vs {match.awayTeam.name}</Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>Control</span>
      </div>

      {/* Control panel label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            Control Panel
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 2 }}>
            {match.tournament.name}{match.round ? ` · ${match.round}` : ''}
          </div>
        </div>
        <Link href={`/matches/${id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '7px 14px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border2)',
            color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            👁 View Match
          </button>
        </Link>
      </div>

      {/* Compact score hero */}
      <MatchScoreHero
        compact
        initialMatch={{
          id: match.id,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homePenaltyScore: match.homePenaltyScore,
          awayPenaltyScore: match.awayPenaltyScore,
          matchTime: match.matchTime,
          firstHalfStartedAt: match.firstHalfStartedAt?.toISOString() ?? null,
          halfTimeAt: match.halfTimeAt?.toISOString() ?? null,
          secondHalfStartedAt: match.secondHalfStartedAt?.toISOString() ?? null,
          fullTimeAt: match.fullTimeAt?.toISOString() ?? null,
          etFirstHalfStartedAt: match.etFirstHalfStartedAt?.toISOString() ?? null,
          etHalfTimeAt: match.etHalfTimeAt?.toISOString() ?? null,
          etSecondHalfStartedAt: match.etSecondHalfStartedAt?.toISOString() ?? null,
          etFullTimeAt: match.etFullTimeAt?.toISOString() ?? null,
          penaltyStartedAt: match.penaltyStartedAt?.toISOString() ?? null,
          completedAt: match.completedAt?.toISOString() ?? null,
          venue: match.venue,
          scheduledAt: match.scheduledAt.toISOString(),
          homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name, homeColour: match.homeTeam.homeColour },
          awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name, homeColour: match.awayTeam.homeColour },
          group: match.group,
          round: match.round,
        }}
      />

      {/* Phase Control — has own card */}
      <PhaseControl matchId={id} status={match.status} />

      {/* Penalty Shootout — shown at top position during PSO */}
      {isPSO && (
        <PenaltyTracker
          matchId={id}
          status={match.status}
          homeTeam={{ id: match.homeTeamId, name: match.homeTeam.name }}
          awayTeam={{ id: match.awayTeamId, name: match.awayTeam.name }}
          players={allLineupPlayers}
          initialKicks={match.penalties}
          canEdit
        />
      )}

      {/* Log Event — has own card */}
      <EventLogger
        matchId={id}
        status={match.status}
        homeTeam={{ id: match.homeTeamId, name: match.homeTeam.name }}
        awayTeam={{ id: match.awayTeamId, name: match.awayTeam.name }}
        players={allLineupPlayers}
        timestamps={{
          matchTime: match.matchTime,
          firstHalfStartedAt: match.firstHalfStartedAt?.toISOString() ?? null,
          secondHalfStartedAt: match.secondHalfStartedAt?.toISOString() ?? null,
          etFirstHalfStartedAt: match.etFirstHalfStartedAt?.toISOString() ?? null,
          etSecondHalfStartedAt: match.etSecondHalfStartedAt?.toISOString() ?? null,
        }}
      />

      {/* Event Log — wrap in styled card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text2)' }}>
            Event Log
          </span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <MatchTimeline
            matchId={id}
            homeTeamId={match.homeTeamId}
            initialEvents={match.events}
            canDelete
            canEdit
            homeTeam={{ id: match.homeTeamId, name: match.homeTeam.name }}
            awayTeam={{ id: match.awayTeamId, name: match.awayTeam.name }}
            players={allLineupPlayers}
          />
        </div>
      </div>

      {/* Player of the Match — has own card */}
      {match.status === 'COMPLETED' && (
        <PlayerOfMatch
          matchId={id}
          currentPlayerId={match.playerOfMatchId ?? null}
          players={allLineupPlayers.map((p) => ({ id: p.id, displayName: p.displayName, jerseyNumber: p.jerseyNumber, teamId: p.teamId }))}
          homeTeam={{ id: match.homeTeamId, name: match.homeTeam.name }}
          awayTeam={{ id: match.awayTeamId, name: match.awayTeam.name }}
        />
      )}

      {/* Lineup Configuration — each LineupPanel has own card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LineupPanel
          matchId={id}
          teamId={match.homeTeamId}
          teamName={match.homeTeam.name}
          members={homeMembers}
          playingMembers={match.playingMembers}
          maxSubstitutes={match.maxSubstitutes}
          disabled={match.status !== 'SCHEDULED'}
        />
        <LineupPanel
          matchId={id}
          teamId={match.awayTeamId}
          teamName={match.awayTeam.name}
          members={awayMembers}
          playingMembers={match.playingMembers}
          maxSubstitutes={match.maxSubstitutes}
          disabled={match.status !== 'SCHEDULED'}
        />
      </div>

      {/* Back link */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <Link href={`/matches/${id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '9px 22px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border2)',
            color: 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            ← Back to Match
          </button>
        </Link>
      </div>

    </div>
  )
}
