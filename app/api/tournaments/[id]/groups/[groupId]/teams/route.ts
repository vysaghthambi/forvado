import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'

type Props = { params: Promise<{ id: string; groupId: string }> }

export async function POST(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, groupId } = await params
  if (!(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = z.object({ teamId: z.string() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

  const tt = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId: id, teamId: parsed.data.teamId } },
    select: { id: true },
  })
  if (!tt) return NextResponse.json({ error: 'Team not registered in this tournament' }, { status: 404 })

  await prisma.tournamentTeam.update({
    where: { tournamentId_teamId: { tournamentId: id, teamId: parsed.data.teamId } },
    data: { groupId },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id, groupId } = await params
  if (!(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = z.object({ teamId: z.string() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

  await prisma.tournamentTeam.updateMany({
    where: { tournamentId: id, teamId: parsed.data.teamId, groupId },
    data: { groupId: null },
  })

  return NextResponse.json({ success: true })
}
