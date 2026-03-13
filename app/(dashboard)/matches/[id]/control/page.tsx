import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { canManageTournament } from '@/services/tournaments'
import { LiveScore } from '@/components/matches/live-score'
import { PhaseControl } from '@/components/matches/phase-control'
import { EventLogger } from '@/components/matches/event-logger'
import { LineupPanel } from '@/components/matches/lineup-panel'
import { MatchTimeline } from '@/components/matches/match-timeline'
import { PenaltyTracker } from '@/components/matches/penalty-tracker'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { format } from 'date-fns'

type Props = { params: Promise<{ id: string }> }

export default async function MatchControlPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: {
        select: {
          id: true, name: true, badgeUrl: true,
          members: {
            where: { status: 'ACTIVE' },
            include: { user: { select: { id: true, displayName: true, avatarUrl: true, position: true, jerseyNumber: true } } },
          },
        },
      },
      awayTeam: {
        select: {
          id: true, name: true, badgeUrl: true,
          members: {
            where: { status: 'ACTIVE' },
            include: { user: { select: { id: true, displayName: true, avatarUrl: true, position: true, jerseyNumber: true } } },
          },
        },
      },
      tournament: { select: { id: true, name: true } },
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

  // All players from both lineups for event/penalty logging
  const allLineupPlayers = match.lineups.map((l) => ({
    id: l.userId,
    displayName: (
      homeMembers.find((m) => m.userId === l.userId) ??
      awayMembers.find((m) => m.userId === l.userId)
    )?.displayName ?? l.userId,
    jerseyNumber: l.jerseyNumber,
    isSubstitute: l.isSubstitute,
    position: l.position,
    teamId: l.teamId,
  }))

  const isPSO = match.status === 'PENALTY_SHOOTOUT' || match.penalties.length > 0

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/matches/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="text-center">
          <p className="text-xs font-semibold text-primary">CONTROL PANEL</p>
          <p className="text-xs text-muted-foreground">{match.tournament.name}</p>
          {match.round && <p className="text-xs text-muted-foreground">{match.round}</p>}
          <p className="text-xs text-muted-foreground">{format(new Date(match.scheduledAt), 'MMM d, yyyy HH:mm')}</p>
        </div>
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/matches/${id}`}><Eye className="h-4 w-4" /></Link>
        </Button>
      </div>

      {/* Live Score */}
      <LiveScore initialMatch={{
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
      }} />

      {/* Phase Control */}
      <PhaseControl matchId={id} status={match.status} />

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList className={`grid w-full ${isPSO ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="lineups">Lineups</TabsTrigger>
          {isPSO && <TabsTrigger value="penalties">Penalties</TabsTrigger>}
        </TabsList>

        <TabsContent value="events" className="mt-4 space-y-4">
          <EventLogger
            matchId={id}
            status={match.status}
            homeTeam={{ id: match.homeTeamId, name: match.homeTeam.name }}
            awayTeam={{ id: match.awayTeamId, name: match.awayTeam.name }}
            players={allLineupPlayers}
            timestamps={{
              matchTime:              match.matchTime,
              firstHalfStartedAt:     match.firstHalfStartedAt?.toISOString()  ?? null,
              secondHalfStartedAt:    match.secondHalfStartedAt?.toISOString() ?? null,
              etFirstHalfStartedAt:   match.etFirstHalfStartedAt?.toISOString() ?? null,
              etSecondHalfStartedAt:  match.etSecondHalfStartedAt?.toISOString() ?? null,
            }}
          />
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Event Log</h3>
            <MatchTimeline
              matchId={id}
              homeTeamId={match.homeTeamId}
              initialEvents={match.events}
              canDelete={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="lineups" className="mt-4 space-y-4">
          <LineupPanel
            matchId={id}
            teamId={match.homeTeamId}
            teamName={match.homeTeam.name}
            members={homeMembers}
            playingMembers={match.playingMembers}
            maxSubstitutes={match.maxSubstitutes}
            disabled={match.status === 'COMPLETED' || match.status === 'CANCELLED'}
          />
          <LineupPanel
            matchId={id}
            teamId={match.awayTeamId}
            teamName={match.awayTeam.name}
            members={awayMembers}
            playingMembers={match.playingMembers}
            maxSubstitutes={match.maxSubstitutes}
            disabled={match.status === 'COMPLETED' || match.status === 'CANCELLED'}
          />
        </TabsContent>

        {isPSO && (
          <TabsContent value="penalties" className="mt-4">
            <PenaltyTracker
              matchId={id}
              status={match.status}
              homeTeam={{ id: match.homeTeamId, name: match.homeTeam.name }}
              awayTeam={{ id: match.awayTeamId, name: match.awayTeam.name }}
              players={allLineupPlayers}
              initialKicks={match.penalties}
              canEdit={true}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
