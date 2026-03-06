import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, requireTeamOwner } from '@/lib/rbac'
import { createNotification } from '@/services/notifications'
import { z } from 'zod'

type Props = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: {
      team: { select: { id: true, name: true, badgeUrl: true, homeColour: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { registeredAt: 'asc' },
  })

  return NextResponse.json({ teams })
}

export async function POST(req: NextRequest, { params }: Props) {
  const { user, error } = await requireTeamOwner()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = z.object({ teamId: z.string() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

  const { teamId } = parsed.data

  // Verify user owns this team (unless admin)
  if (user.role !== 'ADMIN') {
    const team = await prisma.team.findFirst({ where: { id: teamId, ownerId: user.id, deletedAt: null }, select: { id: true } })
    if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id, deletedAt: null },
    include: { _count: { select: { teams: true } } },
  })
  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  if (tournament.status !== 'REGISTRATION') {
    return NextResponse.json({ error: 'Tournament is not open for registration' }, { status: 409 })
  }
  if (tournament._count.teams >= tournament.maxTeams) {
    return NextResponse.json({ error: 'Tournament is full' }, { status: 409 })
  }

  const existing = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId: id, teamId } },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ error: 'Team already registered' }, { status: 409 })

  const tt = await prisma.tournamentTeam.create({
    data: { tournamentId: id, teamId },
    include: { team: { select: { id: true, name: true } } },
  })

  // Notify tournament creator
  if (tournament.createdById !== user.id) {
    await createNotification({
      userId: tournament.createdById,
      title: 'Team Registered',
      body: `${tt.team.name} has registered for ${tournament.name}`,
      link: `/tournaments/${id}`,
    })
  }

  return NextResponse.json({ team: tt }, { status: 201 })
}
