import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

type Props = { params: Promise<{ id: string }> }

const lineupPlayerSchema = z.object({
  userId: z.string(),
  jerseyNumber: z.number().int().min(1).max(99),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
  isSubstitute: z.boolean(),
})

const schema = z.object({
  teamId: z.string(),
  players: z.array(lineupPlayerSchema).min(1),
})

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const lineups = await prisma.matchLineup.findMany({
    where: { matchId: id },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ teamId: 'asc' }, { isSubstitute: 'asc' }, { jerseyNumber: 'asc' }],
  })

  return NextResponse.json({ lineups })
}

export async function POST(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true, homeTeamId: true, awayTeamId: true, playingMembers: true, maxSubstitutes: true, status: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const completedStatuses = ['COMPLETED', 'CANCELLED']
  if (completedStatuses.includes(match.status)) {
    return NextResponse.json({ error: 'Cannot update lineup for a completed match' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const { teamId, players } = parsed.data
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    return NextResponse.json({ error: 'Team is not in this match' }, { status: 400 })
  }

  const starters = players.filter((p) => !p.isSubstitute)
  const bench = players.filter((p) => p.isSubstitute)

  if (starters.length > match.playingMembers) {
    return NextResponse.json({ error: `Too many starters. Max: ${match.playingMembers}` }, { status: 400 })
  }
  if (bench.length > match.maxSubstitutes) {
    return NextResponse.json({ error: `Too many bench players. Max: ${match.maxSubstitutes}` }, { status: 400 })
  }

  // Upsert: delete existing lineup for this team in this match, then re-create
  await prisma.matchLineup.deleteMany({ where: { matchId: id, teamId } })
  await prisma.matchLineup.createMany({
    data: players.map((p) => ({
      matchId: id,
      teamId,
      userId: p.userId,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      isSubstitute: p.isSubstitute,
    })),
  })

  revalidateTag(`match-${id}`, {})
  return NextResponse.json({ success: true })
}
