import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'
import type { MatchEventType } from '@prisma/client'
import { revalidateTag } from 'next/cache'

type Props = { params: Promise<{ id: string; eventId: string }> }

const GOAL_TYPES: MatchEventType[] = ['GOAL', 'OWN_GOAL', 'EXTRA_TIME_GOAL']

const patchSchema = z.object({
  type: z.enum(['GOAL', 'OWN_GOAL', 'EXTRA_TIME_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW', 'SUBSTITUTION']),
  minute: z.number().int().min(0).max(200),
  teamId: z.string(),
  primaryUserId: z.string().nullable().optional(),
  secondaryUserId: z.string().nullable().optional(),
})

/** Recalculate homeScore/awayScore from all goal events (called after any edit/delete). */
async function recalcScore(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], matchId: string, homeTeamId: string, awayTeamId: string) {
  const goals = await tx.matchEvent.findMany({
    where: { matchId, type: { in: GOAL_TYPES } },
    select: { type: true, teamId: true },
  })
  let homeScore = 0, awayScore = 0
  for (const g of goals) {
    const scoringTeam = g.type === 'OWN_GOAL'
      ? (g.teamId === homeTeamId ? awayTeamId : homeTeamId)
      : g.teamId
    if (scoringTeam === homeTeamId) homeScore++
    else awayScore++
  }
  await tx.match.update({ where: { id: matchId }, data: { homeScore, awayScore } })
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, eventId } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true, homeTeamId: true, awayTeamId: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const d = parsed.data
  const oldType = (await prisma.matchEvent.findUnique({ where: { id: eventId }, select: { type: true } }))?.type
  if (!oldType) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const needsRecalc = GOAL_TYPES.includes(oldType) || GOAL_TYPES.includes(d.type)

  const updated = await prisma.$transaction(async (tx) => {
    const evt = await tx.matchEvent.update({
      where: { id: eventId },
      data: {
        type:            d.type,
        minute:          d.minute,
        teamId:          d.teamId,
        primaryUserId:   d.primaryUserId ?? null,
        secondaryUserId: d.secondaryUserId ?? null,
      },
      include: {
        primaryUser:   { select: { id: true, displayName: true } },
        secondaryUser: { select: { id: true, displayName: true } },
        team:          { select: { id: true, name: true } },
      },
    })
    if (needsRecalc) await recalcScore(tx, id, match.homeTeamId, match.awayTeamId)
    return evt
  })

  revalidateTag(`match-${id}`, {})
  revalidateTag(`tournament-${match.tournamentId}`, {})
  revalidateTag(`fixtures-${match.tournamentId}`, {})
  revalidateTag(`standings-${match.tournamentId}`, {})
  return NextResponse.json({ event: updated })
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, eventId } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true, homeTeamId: true, awayTeamId: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    select: { id: true, type: true, teamId: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const needsRecalc = GOAL_TYPES.includes(event.type)
  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.delete({ where: { id: eventId } })
    if (needsRecalc) await recalcScore(tx, id, match.homeTeamId, match.awayTeamId)
  })

  revalidateTag(`match-${id}`, {})
  revalidateTag(`tournament-${match.tournamentId}`, {})
  revalidateTag(`fixtures-${match.tournamentId}`, {})
  revalidateTag(`standings-${match.tournamentId}`, {})
  return NextResponse.json({ success: true })
}
