import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

type Props = { params: Promise<{ id: string; teamId: string }> }

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id, teamId } = await params

  const tt = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId: id, teamId } },
    select: { id: true },
  })
  if (!tt) return NextResponse.json({ error: 'Team not registered' }, { status: 404 })

  await prisma.tournamentTeam.delete({
    where: { tournamentId_teamId: { tournamentId: id, teamId } },
  })

  return NextResponse.json({ ok: true })
}
