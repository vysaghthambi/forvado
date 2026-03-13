import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { canManageTournament, autoUpdateTournamentStatus } from '@/services/tournaments'
import { calculateStandings, calculateGroupStandings } from '@/services/standings'
import { StandingsTable } from '@/components/tournaments/standings-table'
import { FixturesList } from '@/components/tournaments/fixtures-list'
import { RegisteredTeams } from '@/components/tournaments/registered-teams'
import { TournamentAdminPanel } from '@/components/tournaments/tournament-admin-panel'
import { CreateFixtureDialog } from '@/components/tournaments/create-fixture-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Users, Trophy } from 'lucide-react'
import { format } from 'date-fns'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await prisma.tournament.findUnique({ where: { id, deletedAt: null }, select: { name: true } })
  return { title: t ? `${t.name} — Forvado` : 'Tournament — Forvado' }
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  REGISTRATION: 'bg-blue-500/20 text-blue-400',
  UPCOMING: 'bg-amber-500/20 text-amber-400',
  ONGOING: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-muted text-muted-foreground',
}

const FORMAT_LABELS: Record<string, string> = {
  LEAGUE: 'League',
  KNOCKOUT: 'Knockout',
  GROUP_KNOCKOUT: 'Group + Knockout',
}

type Props = { params: Promise<{ id: string }> }

export default async function TournamentDetailPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await prisma.tournament.findUnique({
    where: { id, deletedAt: null },
    include: {
      createdBy: { select: { id: true, displayName: true } },
      groups: {
        include: { teams: { include: { team: { select: { id: true, name: true } } } } },
        orderBy: { name: 'asc' },
      },
      teams: {
        include: {
          team: { select: { id: true, name: true, badgeUrl: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: { registeredAt: 'asc' },
      },
      coordinators: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } },
      },
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true, badgeUrl: true } },
          awayTeam: { select: { id: true, name: true, badgeUrl: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: { matchOrder: 'asc' },
      },
    },
  })

  if (!tournament) notFound()
  if (!tournament.isPublished && !(await canManageTournament(id, user.id, user.role))) notFound()

  // Lazy auto-status transition (UPCOMING→ONGOING→COMPLETED based on dates)
  const currentStatus = await autoUpdateTournamentStatus(id, tournament)

  const canManage = await canManageTournament(id, user.id, user.role)
  const isAdmin = user.role === 'ADMIN'

  // Standings
  let leagueRows = null
  let groupStandings = null
  if (tournament.format === 'GROUP_KNOCKOUT') {
    groupStandings = await calculateGroupStandings(id)
  } else if (tournament.format === 'LEAGUE') {
    leagueRows = await calculateStandings(id)
  }

  const showStandings = tournament.format === 'LEAGUE' || tournament.format === 'GROUP_KNOCKOUT'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/tournaments"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{tournament.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[currentStatus] ?? 'bg-muted'}`}>
                {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase().replace('_', ' ')}
              </span>
              {!tournament.isPublished && (
                <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400">Draft</Badge>
              )}
            </div>
            {tournament.description && (
              <p className="mt-1 text-sm text-muted-foreground">{tournament.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" />{FORMAT_LABELS[tournament.format] ?? tournament.format}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(tournament.startDate), 'MMM d')} – {format(new Date(tournament.endDate), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />{tournament.teams.length} / {tournament.maxTeams} teams
          </span>
          {tournament.venue && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tournament.venue}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={showStandings ? 'standings' : 'fixtures'}>
        <TabsList className="grid w-full grid-cols-4">
          {showStandings && <TabsTrigger value="standings">Standings</TabsTrigger>}
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          {canManage && <TabsTrigger value="manage">Manage</TabsTrigger>}
          {!showStandings && !canManage && <div />}
        </TabsList>

        {showStandings && (
          <TabsContent value="standings" className="mt-4">
            {tournament.format === 'LEAGUE' && leagueRows && (
              <StandingsTable rows={leagueRows} />
            )}
            {tournament.format === 'GROUP_KNOCKOUT' && groupStandings && (
              <div className="space-y-6">
                {groupStandings.map((g) => (
                  <StandingsTable key={g.groupId} rows={g.rows} title={`Group ${g.groupName}`} />
                ))}
                {groupStandings.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No groups configured yet.</p>
                )}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="fixtures" className="mt-4">
          <div className="space-y-4">
            {canManage && (
              <div className="flex justify-end">
                <CreateFixtureDialog
                  tournamentId={id}
                  format={tournament.format}
                  teams={tournament.teams}
                  groups={tournament.groups}
                  matchCount={tournament.matches.length}
                  matchTime={tournament.matchTime}
                  playingMembers={tournament.playingMembers}
                  maxSubstitutes={tournament.maxSubstitutes}
                />
              </div>
            )}
            <FixturesList matches={tournament.matches} showGroup={tournament.format === 'GROUP_KNOCKOUT'} />
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <RegisteredTeams teams={tournament.teams} />
        </TabsContent>

        {canManage && (
          <TabsContent value="manage" className="mt-4">
            <TournamentAdminPanel
              tournamentId={id}
              status={currentStatus}
              isPublished={tournament.isPublished}
              coordinators={tournament.coordinators}
              groups={tournament.groups}
              teams={tournament.teams}
              maxTeams={tournament.maxTeams}
              format={tournament.format}
              isAdmin={isAdmin}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
