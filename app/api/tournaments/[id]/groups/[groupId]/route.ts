import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'

type Props = { params: Promise<{ id: string; groupId: string }> }

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, groupId } = await params
  if (!(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const group = await prisma.tournamentGroup.findUnique({
    where: { id: groupId },
    select: { id: true, _count: { select: { matches: true } } },
  })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (group._count.matches > 0) {
    return NextResponse.json({ error: 'Cannot delete group with matches' }, { status: 409 })
  }

  // Unassign teams from group before deleting
  await prisma.tournamentTeam.updateMany({ where: { groupId }, data: { groupId: null } })
  await prisma.tournamentGroup.delete({ where: { id: groupId } })

  return NextResponse.json({ success: true })
}
