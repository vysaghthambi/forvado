import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { createNotification } from '@/services/notifications'

const schema = z.object({ action: z.enum(['ACCEPT', 'REJECT']) })

type Params = { params: Promise<{ id: string; invId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id: teamId, invId } = await params

  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invId },
    include: { team: { select: { id: true, name: true, ownerId: true } } },
  })

  if (!invitation || invitation.teamId !== teamId) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }
  if (invitation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invitation already resolved' }, { status: 409 })
  }

  // Permission check: owner handles JOIN_REQUESTs, invitee handles INVITEs
  const isOwner = invitation.team.ownerId === user.id || user.role === 'ADMIN'
  const isInvitee = invitation.userId === user.id

  if (invitation.type === 'JOIN_REQUEST' && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (invitation.type === 'INVITE' && !isInvitee && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { action } = parsed.data

  const updated = await prisma.teamInvitation.update({
    where: { id: invId },
    data: { status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED', respondedAt: new Date() },
  })

  // On acceptance — add the user to the team
  if (action === 'ACCEPT') {
    await prisma.teamMembership.upsert({
      where: { teamId_userId: { teamId, userId: invitation.userId } },
      create: { teamId, userId: invitation.userId, role: 'PLAYER', status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    })

    // Notify the relevant party
    if (invitation.type === 'INVITE') {
      // Owner gets notified when invitee accepts
      await createNotification({
        userId: invitation.team.ownerId,
        title: 'Invitation Accepted',
        body: `A player has joined ${invitation.team.name}.`,
        link: `/teams/${teamId}`,
      })
    } else {
      // Player gets notified when owner accepts join request
      await createNotification({
        userId: invitation.userId,
        title: 'Join Request Accepted',
        body: `Your request to join ${invitation.team.name} was accepted!`,
        link: `/teams/${teamId}`,
      })
    }
  } else {
    // Notify on rejection too
    if (invitation.type === 'JOIN_REQUEST') {
      await createNotification({
        userId: invitation.userId,
        title: 'Join Request Declined',
        body: `Your request to join ${invitation.team.name} was declined.`,
        link: `/teams`,
      })
    }
  }

  return NextResponse.json({ invitation: updated })
}
