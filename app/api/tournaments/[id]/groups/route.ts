import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'

type Props = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const groups = await prisma.tournamentGroup.findMany({
    where: { tournamentId: id },
    include: {
      teams: { include: { team: { select: { id: true, name: true, badgeUrl: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ groups })
}

export async function POST(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  if (!(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = z.object({ name: z.string().min(1).max(50) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const existing = await prisma.tournamentGroup.findUnique({
    where: { tournamentId_name: { tournamentId: id, name: parsed.data.name } },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ error: 'Group name already exists' }, { status: 409 })

  const group = await prisma.tournamentGroup.create({
    data: { tournamentId: id, name: parsed.data.name },
  })

  return NextResponse.json({ group }, { status: 201 })
}
