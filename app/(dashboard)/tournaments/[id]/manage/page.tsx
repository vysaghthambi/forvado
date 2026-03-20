import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { canManageTournament, autoUpdateTournamentStatus } from '@/services/tournaments'
import { TournamentAdminPanel } from '@/components/tournaments/tournament-admin-panel'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await prisma.tournament.findUnique({ where: { id, deletedAt: null }, select: { name: true } })
  return { title: t ? `Manage ${t.name} — Forvado` : 'Manage Tournament — Forvado' }
}

type Props = { params: Promise<{ id: string }> }

export default async function ManageTournamentPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await prisma.tournament.findUnique({
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
        orderBy: { registeredAt: 'asc' },
      },
      coordinators: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } },
      },
    },
  })

  if (!tournament) notFound()
  if (!(await canManageTournament(id, user.id, user.role))) notFound()

  const currentStatus = await autoUpdateTournamentStatus(id, tournament as any)

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
        <span style={{ color: 'var(--text)' }}>Manage</span>
      </div>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0,
          }}>
            Manage Tournament
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 3 }}>
            {tournament.name} — update status, groups and team assignments.
          </p>
        </div>
      </div>

      {/* Admin panel */}
      <TournamentAdminPanel
        tournamentId={id}
        status={currentStatus}
        isPublished={tournament.isPublished}
        coordinators={tournament.coordinators}
        groups={tournament.groups}
        teams={tournament.teams}
        maxTeams={tournament.maxTeams}
        format={tournament.format}
        isAdmin={user.role === 'ADMIN'}
      />
    </div>
  )
}
