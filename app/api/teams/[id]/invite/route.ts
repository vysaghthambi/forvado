import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { isTeamOwner } from '@/services/teams'
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

  // Run all validation queries in parallel
  const [target, membership, pendingInvite, team] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, displayName: true } }),
    prisma.teamMembership.findUnique({ where: { teamId_userId: { teamId, userId } }, select: { status: true } }),
    prisma.teamInvitation.findFirst({ where: { teamId, userId, status: 'PENDING' }, select: { id: true } }),
    prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
  ])

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (membership?.status === 'ACTIVE') return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
  if (pendingInvite) return NextResponse.json({ error: 'A pending invitation already exists' }, { status: 409 })

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
