import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { canManageTournament, autoUpdateTournamentStatus } from '@/services/tournaments'
import { FixturesList } from '@/components/tournaments/fixtures-list'
import { CreateFixtureDialog } from '@/components/tournaments/create-fixture-dialog'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await prisma.tournament.findUnique({ where: { id, deletedAt: null }, select: { name: true } })
  return { title: t ? `Fixtures · ${t.name} — Forvado` : 'Fixtures — Forvado' }
}

type Props = { params: Promise<{ id: string }> }

function getFixturesData(id: string) {
  return unstable_cache(
    () => prisma.tournament.findUnique({
      where: { id, deletedAt: null },
      include: {
        groups: {
          include: { teams: { include: { team: { select: { id: true, name: true } } } } },
          orderBy: { name: 'asc' },
        },
        teams: {
          include: {
            team: { select: { id: true, name: true, badgeUrl: true, homeColour: true, shortCode: true } },
            group: { select: { id: true, name: true } },
          },
        },
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
    ['tournament-fixtures', id],
    { tags: [`tournament-${id}`, `fixtures-${id}`] },
  )()
}

export default async function TournamentFixturesPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await getFixturesData(id)

  if (!tournament) notFound()
  if (!tournament.isPublished && !(await canManageTournament(id, user.id, user.role))) notFound()

  await autoUpdateTournamentStatus(id, tournament)
  const canManage = await canManageTournament(id, user.id, user.role)
  const canCreateFixture = canManage && ['DRAFT', 'UPCOMING', 'ONGOING'].includes(tournament.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-clr)' }}>
        <Link href="/tournaments" className="no-underline transition-colors hover:text-foreground" style={{ color: 'var(--muted-clr)' }}>
          Tournaments
        </Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <Link href={`/tournaments/${id}`} className="no-underline transition-colors hover:text-foreground" style={{ color: 'var(--muted-clr)' }}>
          {tournament.name}
        </Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>Fixtures</span>
      </div>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0,
          }}>
            All Fixtures
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 3 }}>
            {tournament.name} · {tournament.matches.length} match{tournament.matches.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {canCreateFixture && (
            <CreateFixtureDialog
              tournamentId={id}
              format={tournament.format}
              teams={tournament.teams}
              groups={tournament.groups}
              matchCount={tournament.matches.length}
              matchTime={tournament.matchTime}
              playingMembers={tournament.playingMembers}
              maxSubstitutes={tournament.maxSubstitutes}
              venue={tournament.venue ?? ''}
            />
          )}
        </div>
      </div>

      {/* Full fixtures list */}
      <FixturesList matches={tournament.matches} showGroup={tournament.format === 'GROUP_KNOCKOUT'} canManage={canManage} />
    </div>
  )
}
