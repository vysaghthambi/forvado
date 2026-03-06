import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { InvitationsList } from '@/components/teams/invitations-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Invitations & Requests — Forvado' }

type Props = { params: Promise<{ id: string }> }

export default async function InvitationsPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, name: true, ownerId: true },
  })
  if (!team) notFound()
  if (team.ownerId !== user.id && user.role !== 'ADMIN') redirect(`/teams/${id}`)

  const invitations = await prisma.teamInvitation.findMany({
    where: { teamId: id, status: 'PENDING' },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true, position: true, jerseyNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/teams/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Invitations & Requests</h1>
          <p className="text-sm text-muted-foreground">{team.name}</p>
        </div>
      </div>

      <InvitationsList teamId={id} invitations={invitations} />
    </div>
  )
}
