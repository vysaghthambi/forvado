import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

type Props = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const tournament = await prisma.tournament.findUnique({ where: { id, deletedAt: null }, select: { id: true, isPublished: true } })
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.tournament.update({
    where: { id },
    data: { isPublished: !tournament.isPublished },
    select: { id: true, isPublished: true },
  })

  return NextResponse.json({ isPublished: updated.isPublished })
}
