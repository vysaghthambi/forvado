import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { isTeamOwner, isTeamMember, hasPendingInvitation } from '@/services/teams'
import { createNotification } from '@/services/notifications'

const schema = z.object({ userId: z.string().min(1) })

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id: teamId } = await params

  if (!(await isTeamOwner(teamId, user.id)) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { userId } = parsed.data

  // Validate target user exists
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, displayName: true } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Prevent inviting existing members
  if (await isTeamMember(teamId, userId)) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
  }

  // Prevent duplicate pending invitations
  if (await hasPendingInvitation(teamId, userId)) {
    return NextResponse.json({ error: 'A pending invitation already exists' }, { status: 409 })
  }

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } })

  const invitation = await prisma.teamInvitation.create({
    data: { teamId, userId, type: 'INVITE', status: 'PENDING' },
  })

  // Create in-app notification for the invited user
  await createNotification({
    userId,
    title: 'Team Invitation',
    body: `You have been invited to join ${team?.name}.`,
    link: `/teams/${teamId}`,
  })

  return NextResponse.json({ invitation }, { status: 201 })
}
