import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { isTeamOwner } from '@/services/teams'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id: teamId } = await params

  if (!(await isTeamOwner(teamId, user.id)) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const invitations = await prisma.teamInvitation.findMany({
    where: { teamId, status: 'PENDING' },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true, position: true, jerseyNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invitations })
}
