import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

type Props = { params: Promise<{ id: string; userId: string }> }

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id, userId } = await params
  const c = await prisma.tournamentCoordinator.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId } },
    select: { id: true },
  })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.tournamentCoordinator.delete({ where: { tournamentId_userId: { tournamentId: id, userId } } })
  return NextResponse.json({ success: true })
}
