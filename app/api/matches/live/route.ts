import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'

const LIVE_STATUSES = [
  'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF',
  'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF',
  'PENALTY_SHOOTOUT',
]

export async function GET() {
  const { error } = await getSessionUser()
  if (error) return error

  const matches = await prisma.match.findMany({
    where: { status: { in: LIVE_STATUSES as never[] } },
    select: {
      id: true, status: true,
      homeScore: true, awayScore: true, matchTime: true,
      firstHalfStartedAt: true, halfTimeAt: true,
      secondHalfStartedAt: true, fullTimeAt: true,
      etFirstHalfStartedAt: true, etHalfTimeAt: true,
      etSecondHalfStartedAt: true, etFullTimeAt: true,
      penaltyStartedAt: true, completedAt: true,
      round: true,
      homeTeam: { select: { id: true, name: true, badgeUrl: true, homeColour: true } },
      awayTeam: { select: { id: true, name: true, badgeUrl: true, homeColour: true } },
      tournament: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json({ matches })
}
