import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { isTeamOwner } from '@/services/teams'

type Params = { params: Promise<{ id: string; userId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id: teamId, userId: targetUserId } = await params

  if (!(await isTeamOwner(teamId, user.id)) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Prevent removing the owner themselves
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } })
  if (team?.ownerId === targetUserId) {
    return NextResponse.json({ error: 'Cannot remove the team owner' }, { status: 409 })
  }

  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  })
  if (!membership) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  await prisma.teamMembership.update({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    data: { status: 'INACTIVE' },
  })

  return NextResponse.json({ success: true })
}
