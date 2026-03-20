import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'
import { z } from 'zod'

type Props = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const coordinators = await prisma.tournamentCoordinator.findMany({
    where: { tournamentId: id },
    include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } },
    orderBy: { assignedAt: 'asc' },
  })

  return NextResponse.json({ coordinators })
}

export async function POST(req: NextRequest, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = z.object({ userId: z.string() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { userId } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, displayName: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'User must have ADMIN role' }, { status: 400 })
  }

  const existing = await prisma.tournamentCoordinator.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId } },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ error: 'Already assigned' }, { status: 409 })

  const coordinator = await prisma.tournamentCoordinator.create({
    data: { tournamentId: id, userId },
    include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } },
  })

  return NextResponse.json({ coordinator }, { status: 201 })
}
