import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'

type Props = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  scheduledAt: z.string().optional(),
  venue: z.string().optional(),
  round: z.string().optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  status: z.enum([
    'SCHEDULED', 'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FULL_TIME',
    'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF',
    'EXTRA_TIME_FULL_TIME', 'PENALTY_SHOOTOUT', 'COMPLETED', 'CANCELLED', 'POSTPONED',
  ]).optional(),
})

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
      awayTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
      tournament: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
      events: {
        include: {
          primaryUser: { select: { id: true, displayName: true } },
          secondaryUser: { select: { id: true, displayName: true } },
        },
        orderBy: { minute: 'asc' },
      },
    },
  })

  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ match })
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const match = await prisma.match.findUnique({ where: { id }, select: { tournamentId: true } })
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const d = parsed.data
  const updated = await prisma.match.update({
    where: { id },
    data: {
      ...(d.scheduledAt ? { scheduledAt: new Date(d.scheduledAt) } : {}),
      ...(d.venue !== undefined ? { venue: d.venue } : {}),
      ...(d.round !== undefined ? { round: d.round } : {}),
      ...(d.homeScore !== undefined ? { homeScore: d.homeScore } : {}),
      ...(d.awayScore !== undefined ? { awayScore: d.awayScore } : {}),
      ...(d.status ? { status: d.status, ...(d.status === 'COMPLETED' ? { completedAt: new Date() } : {}) } : {}),
    },
    include: {
      homeTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
      awayTeam: { select: { id: true, name: true, badgeUrl: true, shortCode: true } },
    },
  })

  return NextResponse.json({ match: updated })
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const match = await prisma.match.findUnique({ where: { id }, select: { tournamentId: true, status: true } })
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (match.status !== 'SCHEDULED' && match.status !== 'POSTPONED' && match.status !== 'CANCELLED') {
    return NextResponse.json({ error: 'Cannot delete a match that has started' }, { status: 409 })
  }

  await prisma.match.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
