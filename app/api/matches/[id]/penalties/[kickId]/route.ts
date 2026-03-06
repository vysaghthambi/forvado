import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'

type Props = { params: Promise<{ id: string; kickId: string }> }

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, kickId } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true, homeTeamId: true, awayTeamId: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const kick = await prisma.penaltyShootout.findUnique({ where: { id: kickId }, select: { id: true } })
  if (!kick) return NextResponse.json({ error: 'Penalty kick not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.penaltyShootout.delete({ where: { id: kickId } })
    // Recalculate penalty scores
    const remaining = await tx.penaltyShootout.findMany({
      where: { matchId: id },
      select: { teamId: true, scored: true },
    })
    const homeGoals = remaining.filter((k) => k.teamId === match.homeTeamId && k.scored).length
    const awayGoals = remaining.filter((k) => k.teamId === match.awayTeamId && k.scored).length
    await tx.match.update({
      where: { id },
      data: { homePenaltyScore: homeGoals, awayPenaltyScore: awayGoals },
    })
  })

  return NextResponse.json({ success: true })
}
