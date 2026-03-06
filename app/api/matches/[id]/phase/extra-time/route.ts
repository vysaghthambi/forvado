import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { broadcastMatchEvent } from '@/lib/realtime'

type Props = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true, status: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (!(await canManageTournament(match.tournamentId, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (match.status !== 'FULL_TIME') {
    return NextResponse.json({ error: 'Extra time can only be triggered after Full Time' }, { status: 400 })
  }

  const now = new Date()
  const updated = await prisma.match.update({
    where: { id },
    data: { status: 'EXTRA_TIME_FIRST_HALF', etFirstHalfStartedAt: now },
    select: { id: true, status: true },
  })

  void broadcastMatchEvent(id, 'PHASE_CHANGE', { matchId: id, status: 'EXTRA_TIME_FIRST_HALF', timestamp: now.toISOString() })

  return NextResponse.json({ match: updated })
}
