import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { broadcastMatchEvent } from '@/lib/realtime'
import type { MatchStatus } from '@prisma/client'

type Props = { params: Promise<{ id: string }> }

const NEXT_PHASE: Partial<Record<MatchStatus, MatchStatus>> = {
  SCHEDULED: 'FIRST_HALF',
  FIRST_HALF: 'HALF_TIME',
  HALF_TIME: 'SECOND_HALF',
  SECOND_HALF: 'FULL_TIME',
  FULL_TIME: 'COMPLETED',
  EXTRA_TIME_FIRST_HALF: 'EXTRA_TIME_HALF_TIME',
  EXTRA_TIME_HALF_TIME: 'EXTRA_TIME_SECOND_HALF',
  EXTRA_TIME_SECOND_HALF: 'EXTRA_TIME_FULL_TIME',
  EXTRA_TIME_FULL_TIME: 'COMPLETED',
  PENALTY_SHOOTOUT: 'COMPLETED',
}

function getTimestampField(status: MatchStatus): string | null {
  const map: Partial<Record<MatchStatus, string>> = {
    FIRST_HALF: 'firstHalfStartedAt',
    HALF_TIME: 'halfTimeAt',
    SECOND_HALF: 'secondHalfStartedAt',
    FULL_TIME: 'fullTimeAt',
    EXTRA_TIME_FIRST_HALF: 'etFirstHalfStartedAt',
    EXTRA_TIME_HALF_TIME: 'etHalfTimeAt',
    EXTRA_TIME_SECOND_HALF: 'etSecondHalfStartedAt',
    EXTRA_TIME_FULL_TIME: 'etFullTimeAt',
    PENALTY_SHOOTOUT: 'penaltyStartedAt',
    COMPLETED: 'completedAt',
  }
  return map[status] ?? null
}

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

  const nextStatus = NEXT_PHASE[match.status]
  if (!nextStatus) {
    return NextResponse.json({ error: `No next phase from ${match.status}` }, { status: 400 })
  }

  const tsField = getTimestampField(nextStatus)
  const now = new Date()

  const updated = await prisma.match.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(tsField ? { [tsField]: now } : {}),
    },
    select: { id: true, status: true, [tsField ?? 'id']: true },
  })

  // Broadcast phase change for instant client updates (supplements postgres_changes)
  void broadcastMatchEvent(id, 'PHASE_CHANGE', {
    matchId: id,
    status: nextStatus,
    timestamp: now.toISOString(),
  })

  return NextResponse.json({ match: updated })
}
