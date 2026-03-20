import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

type Props = { params: Promise<{ id: string }> }

const ACTIVE_PHASES = ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_SECOND_HALF']

const schema = z.object({
  type: z.enum(['GOAL', 'OWN_GOAL', 'EXTRA_TIME_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW', 'SUBSTITUTION']),
  minute: z.number().int().min(0).max(200),
  teamId: z.string(),
  primaryUserId: z.string().optional(),
  secondaryUserId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const events = await prisma.matchEvent.findMany({
    where: { matchId: id },
    include: {
      primaryUser: { select: { id: true, displayName: true } },
      secondaryUser: { select: { id: true, displayName: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { minute: 'asc' },
  })

  return NextResponse.json({ events })
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
  if (!ACTIVE_PHASES.includes(match.status)) {
    return NextResponse.json({ error: 'Events can only be logged during active match phases' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const d = parsed.data
  if (d.teamId !== match.homeTeamId && d.teamId !== match.awayTeamId) {
    return NextResponse.json({ error: 'Team is not in this match' }, { status: 400 })
  }

  // Update score on GOAL / OWN_GOAL / EXTRA_TIME_GOAL
  const isGoalEvent = ['GOAL', 'OWN_GOAL', 'EXTRA_TIME_GOAL'].includes(d.type)
  const event = await prisma.$transaction(async (tx) => {
    const newEvent = await tx.matchEvent.create({
      data: {
        matchId: id,
        type: d.type,
        minute: d.minute,
        teamId: d.teamId,
        primaryUserId: d.primaryUserId ?? null,
        secondaryUserId: d.secondaryUserId ?? null,
        notes: d.notes ?? null,
        createdById: user.id,
      },
      include: {
        primaryUser: { select: { id: true, displayName: true } },
        secondaryUser: { select: { id: true, displayName: true } },
        team: { select: { id: true, name: true } },
      },
    })

    if (isGoalEvent) {
      const current = await tx.match.findUnique({ where: { id }, select: { homeScore: true, awayScore: true, homeTeamId: true } })
      if (current) {
        // OWN_GOAL scores for the OPPOSING team
        const isOwnGoal = d.type === 'OWN_GOAL'
        const scoringTeamId = isOwnGoal
          ? (d.teamId === current.homeTeamId ? match.awayTeamId : current.homeTeamId)
          : d.teamId
        const isHome = scoringTeamId === current.homeTeamId
        await tx.match.update({
          where: { id },
          data: {
            homeScore: isHome ? current.homeScore + 1 : current.homeScore,
            awayScore: !isHome ? current.awayScore + 1 : current.awayScore,
          },
        })
      }
    }

    return newEvent
  })

  revalidateTag(`match-${id}`, {})
  revalidateTag(`tournament-${match.tournamentId}`, {})
  revalidateTag(`fixtures-${match.tournamentId}`, {})
  revalidateTag(`standings-${match.tournamentId}`, {})
  return NextResponse.json({ event }, { status: 201 })
}
