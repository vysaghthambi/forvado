import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { isTeamMember, hasPendingInvitation } from '@/services/teams'
import { createNotification } from '@/services/notifications'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id: teamId } = await params

  const team = await prisma.team.findUnique({
    where: { id: teamId, deletedAt: null },
    select: { id: true, name: true, isAcceptingRequests: true, ownerId: true },
  })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  if (!team.isAcceptingRequests) {
    return NextResponse.json({ error: 'Team is not accepting requests' }, { status: 409 })
  }
  if (await isTeamMember(teamId, user.id)) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }
  if (await hasPendingInvitation(teamId, user.id)) {
    return NextResponse.json({ error: 'A pending request already exists' }, { status: 409 })
  }

  const invitation = await prisma.teamInvitation.create({
    data: { teamId, userId: user.id, type: 'JOIN_REQUEST', status: 'PENDING' },
  })

  // Notify the team owner
  await createNotification({
    userId: team.ownerId,
    title: 'New Join Request',
    body: `${user.displayName} has requested to join ${team.name}.`,
    link: `/teams/${teamId}/invitations`,
  })

  return NextResponse.json({ invitation }, { status: 201 })
}
