import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

type Props = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      isPublished: true,
      status: true,
      startDate: true,
      endDate: true,
      maxTeams: true,
      format: true,
      _count: { select: { teams: true } },
      teams: { select: { groupId: true } },
    },
  })
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (tournament.isPublished) {
    // Unpublish: revert to DRAFT
    const updated = await prisma.tournament.update({
      where: { id },
      data: { isPublished: false, status: 'DRAFT' },
      select: { id: true, isPublished: true, status: true },
    })
    return NextResponse.json({ isPublished: updated.isPublished, status: updated.status })
  }

  // Publishing — validate team count
  if (tournament._count.teams !== tournament.maxTeams) {
    return NextResponse.json(
      { error: `Add all teams before publishing (${tournament._count.teams}/${tournament.maxTeams})` },
      { status: 409 }
    )
  }

  // For GROUP_KNOCKOUT: all teams must be assigned to a group
  if (tournament.format === 'GROUP_KNOCKOUT') {
    const unassigned = tournament.teams.filter((t) => !t.groupId).length
    if (unassigned > 0) {
      return NextResponse.json(
        { error: `Assign all teams to groups before publishing (${unassigned} unassigned)` },
        { status: 409 }
      )
    }
  }

  // Determine initial status from dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(tournament.startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(tournament.endDate)
  end.setHours(0, 0, 0, 0)

  let resolvedStatus: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
  if (today < start) {
    resolvedStatus = 'UPCOMING'
  } else if (today > end) {
    resolvedStatus = 'COMPLETED'
  } else {
    resolvedStatus = 'ONGOING'
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: { isPublished: true, status: resolvedStatus },
    select: { id: true, isPublished: true, status: true },
  })

  return NextResponse.json({ isPublished: updated.isPublished, status: updated.status })
}
