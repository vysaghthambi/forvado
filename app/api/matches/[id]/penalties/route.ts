import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'

type Props = { params: Promise<{ id: string }> }

const schema = z.object({
  teamId: z.string(),
  userId: z.string().optional(),
  kickOrder: z.number().int().min(1),
  scored: z.boolean(),
})

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const penalties = await prisma.penaltyShootout.findMany({
    where: { matchId: id },
    include: {
      user: { select: { id: true, displayName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ teamId: 'asc' }, { kickOrder: 'asc' }],
  })

  return NextResponse.json({ penalties })
}

export async function POST(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true, homeTeamId: true, awayTeamId: true, status: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (match.status !== 'PENALTY_SHOOTOUT') {
    return NextResponse.json({ error: 'Penalty kicks can only be logged during PENALTY_SHOOTOUT phase' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const d = parsed.data
  if (d.teamId !== match.homeTeamId && d.teamId !== match.awayTeamId) {
    return NextResponse.json({ error: 'Team is not in this match' }, { status: 400 })
  }

  const penalty = await prisma.$transaction(async (tx) => {
    const kick = await tx.penaltyShootout.create({
      data: {
        matchId: id,
        teamId: d.teamId,
        userId: d.userId ?? null,
        kickOrder: d.kickOrder,
        scored: d.scored,
        createdById: user.id,
      },
      include: {
        user: { select: { id: true, displayName: true } },
        team: { select: { id: true, name: true } },
      },
    })

    // Update penalty score totals
    const allKicks = await tx.penaltyShootout.findMany({
      where: { matchId: id },
      select: { teamId: true, scored: true },
    })
    const homeGoals = allKicks.filter((k) => k.teamId === match.homeTeamId && k.scored).length
    const awayGoals = allKicks.filter((k) => k.teamId === match.awayTeamId && k.scored).length
    await tx.match.update({
      where: { id },
      data: { homePenaltyScore: homeGoals, awayPenaltyScore: awayGoals },
    })

    return kick
  })

  return NextResponse.json({ penalty }, { status: 201 })
}
