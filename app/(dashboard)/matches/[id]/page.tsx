import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { canManageTournament } from '@/services/tournaments'
import { LiveScore } from '@/components/matches/live-score'
import { MatchTimeline } from '@/components/matches/match-timeline'
import { LineupDisplay } from '@/components/matches/lineup-display'
import { PenaltyTracker } from '@/components/matches/penalty-tracker'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Settings, Star } from 'lucide-react'
import { format } from 'date-fns'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const m = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
  })
  return { title: m ? `${m.homeTeam.name} vs ${m.awayTeam.name} — Forvado` : 'Match — Forvado' }
}

type Props = { params: Promise<{ id: string }> }

const GOAL_TYPES = new Set(['GOAL', 'EXTRA_TIME_GOAL', 'OWN_GOAL'])

export default async function MatchPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true, badgeUrl: true } },
      awayTeam: { select: { id: true, name: true, badgeUrl: true } },
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
  })

  if (!match) notFound()

  const canManage = await canManageTournament(match.tournamentId, user.id, user.role)

  const homeLineup = {
    teamId: match.homeTeamId,
    teamName: match.homeTeam.name,
    players: match.lineups.filter((l) => l.teamId === match.homeTeamId),
  }
  const awayLineup = {
    teamId: match.awayTeamId,
    teamName: match.awayTeam.name,
    players: match.lineups.filter((l) => l.teamId === match.awayTeamId),
  }

  const hasPenalties = match.status === 'PENALTY_SHOOTOUT' || match.penalties.length > 0
  const hasLineups = match.lineups.length > 0

  const penaltyPlayers = match.lineups.map((l) => ({
    id: l.userId,
    displayName: l.user.displayName,
    jerseyNumber: l.jerseyNumber,
    teamId: l.teamId,
  }))

  // Goal scorers for quick display below score
  const goalEvents = match.events.filter((e) => GOAL_TYPES.has(e.type))
  const homeScorers = goalEvents
    .filter((e) => {
      // OWN_GOAL from away team goes to home; regular goals by home team
      if (e.type === 'OWN_GOAL') return e.team.id === match.awayTeamId
      return e.team.id === match.homeTeamId
    })
    .map((e) => `${e.primaryUser?.displayName?.split(' ').at(-1) ?? '?'} ${e.minute}'`)

  const awayScorers = goalEvents
    .filter((e) => {
      if (e.type === 'OWN_GOAL') return e.team.id === match.homeTeamId
      return e.team.id === match.awayTeamId
    })
    .map((e) => `${e.primaryUser?.displayName?.split(' ').at(-1) ?? '?'} ${e.minute}'`)

  const hasScore = ['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF',
    'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF', 'PENALTY_SHOOTOUT',
    'FULL_TIME', 'EXTRA_TIME_FULL_TIME', 'COMPLETED'].includes(match.status)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/tournaments/${match.tournamentId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">{match.tournament.name}</p>
          {match.group && (
            <p className="text-xs text-muted-foreground">Group {match.group.name}</p>
          )}
          {match.round && <Badge variant="outline" className="text-xs mt-0.5">{match.round}</Badge>}
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(match.scheduledAt), 'MMM d, yyyy HH:mm')}
          </p>
        </div>
        {canManage ? (
          <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link href={`/matches/${id}/control`}><Settings className="h-4 w-4" /></Link>
          </Button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Live Score */}
      <LiveScore
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
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
        }}
      />

      {/* Goal scorers — quick view below score */}
      {hasScore && (homeScorers.length > 0 || awayScorers.length > 0) && (
        <div className="grid grid-cols-2 gap-4 -mt-2 px-2">
          <div className="space-y-0.5">
            {homeScorers.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-[10px]">⚽</span> {s}
              </p>
            ))}
          </div>
          <div className="space-y-0.5 text-right">
            {awayScorers.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                {s} <span className="text-[10px]">⚽</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Player of the Match */}
      {match.playerOfMatch && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
          <Star className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Player of the Match
            </p>
            <p className="text-sm font-semibold">{match.playerOfMatch.displayName}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList className={`grid w-full ${hasPenalties ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="events">Events</TabsTrigger>
          {hasLineups ? (
            <TabsTrigger value="lineups">Lineups</TabsTrigger>
          ) : (
            <TabsTrigger value="lineups" disabled>Lineups</TabsTrigger>
          )}
          {hasPenalties && <TabsTrigger value="penalties">Penalties</TabsTrigger>}
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <MatchTimeline
              matchId={id}
              homeTeamId={match.homeTeamId}
              initialEvents={match.events}
              canDelete={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="lineups" className="mt-4">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <LineupDisplay home={homeLineup} away={awayLineup} />
          </div>
        </TabsContent>

        {hasPenalties && (
          <TabsContent value="penalties" className="mt-4">
            <PenaltyTracker
              matchId={id}
              status={match.status}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              players={penaltyPlayers}
              initialKicks={match.penalties}
              canEdit={false}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
