import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'

type Props = { params: Promise<{ id: string; eventId: string }> }

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, eventId } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true, homeTeamId: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    select: { id: true, type: true, teamId: true },
  })
  if (!event || event.id !== eventId) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Reverse score if it was a goal
  const isGoalEvent = ['GOAL', 'OWN_GOAL', 'EXTRA_TIME_GOAL'].includes(event.type)
  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.delete({ where: { id: eventId } })
    if (isGoalEvent) {
      const current = await tx.match.findUnique({ where: { id }, select: { homeScore: true, awayScore: true, homeTeamId: true } })
      if (current) {
        const isOwnGoal = event.type === 'OWN_GOAL'
        const scoringTeamId = isOwnGoal
          ? (event.teamId === current.homeTeamId ? match.homeTeamId : current.homeTeamId)
          : event.teamId
        const wasHome = scoringTeamId === current.homeTeamId
        await tx.match.update({
          where: { id },
          data: {
            homeScore: wasHome ? Math.max(0, current.homeScore - 1) : current.homeScore,
            awayScore: !wasHome ? Math.max(0, current.awayScore - 1) : current.awayScore,
          },
        })
      }
    }
  })

  return NextResponse.json({ success: true })
}
