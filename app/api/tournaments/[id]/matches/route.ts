import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

type Props = { params: Promise<{ id: string }> }

const createSchema = z.object({
  homeTeamId:     z.string(),
  awayTeamId:     z.string(),
  scheduledAt:    z.string(),
  venue:          z.string().optional(),
  groupId:        z.string().optional(),
  round:          z.string().optional(),
  matchOrder:     z.number().int().positive().optional(),
  matchTime:      z.string().optional(),
  playingMembers: z.string().optional(),
  maxSubstitutes: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId') ?? undefined
  const round = searchParams.get('round') ?? undefined

  const matches = await prisma.match.findMany({
    where: {
      tournamentId: id,
      ...(groupId ? { groupId } : {}),
      ...(round ? { round } : {}),
    },
    include: {
      homeTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
      awayTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { matchOrder: 'asc' },
  })

  return NextResponse.json({ matches })
}

export async function POST(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  if (!(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const d = parsed.data
  if (d.homeTeamId === d.awayTeamId) {
    return NextResponse.json({ error: 'Home and away teams must be different' }, { status: 400 })
  }

  // Verify both teams are registered
  const registrations = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id, teamId: { in: [d.homeTeamId, d.awayTeamId] } },
    select: { teamId: true },
  })
  if (registrations.length < 2) {
    return NextResponse.json({ error: 'Both teams must be registered in this tournament' }, { status: 400 })
  }

  const FIXTURE_ALLOWED_STATUSES = ['DRAFT', 'UPCOMING', 'ONGOING']

  const tournament = await prisma.tournament.findUnique({
    where: { id, deletedAt: null },
    select: { matchTime: true, playingMembers: true, maxSubstitutes: true, status: true },
  })
  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  if (!FIXTURE_ALLOWED_STATUSES.includes(tournament.status)) {
    return NextResponse.json({ error: 'Fixtures can only be created for Draft, Upcoming, or Ongoing tournaments' }, { status: 409 })
  }

  // Use caller-supplied match order, or auto-assign after the last existing one
  let matchOrder = d.matchOrder
  if (!matchOrder) {
    const lastMatch = await prisma.match.findFirst({
      where: { tournamentId: id },
      orderBy: { matchOrder: 'desc' },
      select: { matchOrder: true },
    })
    matchOrder = (lastMatch?.matchOrder ?? 0) + 1
  }

  // Check matchOrder uniqueness within this tournament
  if (matchOrder) {
    const conflict = await prisma.match.findUnique({
      where: { tournamentId_matchOrder: { tournamentId: id, matchOrder } },
      select: { id: true },
    })
    if (conflict) {
      return NextResponse.json(
        { error: `Match #${matchOrder} already exists in this tournament. Use a different number.` },
        { status: 409 },
      )
    }
  }

  const match = await prisma.match.create({
    data: {
      tournamentId: id,
      homeTeamId: d.homeTeamId,
      awayTeamId: d.awayTeamId,
      matchOrder,
      scheduledAt: new Date(d.scheduledAt),
      venue: d.venue,
      groupId: d.groupId ?? null,
      round: d.round ?? null,
      matchTime: d.matchTime ? parseInt(d.matchTime) : tournament.matchTime,
      playingMembers: d.playingMembers ? parseInt(d.playingMembers) : tournament.playingMembers,
      maxSubstitutes: d.maxSubstitutes ? parseInt(d.maxSubstitutes) : tournament.maxSubstitutes,
    },
    include: {
      homeTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
      awayTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
    },
  })

  revalidateTag(`tournament-${id}`, {})
  revalidateTag(`fixtures-${id}`, {})
  return NextResponse.json({ match }, { status: 201 })
}
