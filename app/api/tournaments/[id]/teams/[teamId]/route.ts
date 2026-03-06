import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'

type Props = { params: Promise<{ id: string; teamId: string }> }

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, teamId } = await params

  // Allow team owner to withdraw or admin/coordinator to remove
  const canManage = await canManageTournament(id, user.id, user.role)
  if (!canManage) {
    const team = await prisma.team.findFirst({ where: { id: teamId, ownerId: user.id, deletedAt: null }, select: { id: true } })
    if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tt = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId: id, teamId } },
    select: { id: true },
  })
  if (!tt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.tournamentTeam.delete({ where: { tournamentId_teamId: { tournamentId: id, teamId } } })
  return NextResponse.json({ success: true })
}
