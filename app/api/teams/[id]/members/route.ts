import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { z } from 'zod'

type Props = { params: Promise<{ id: string }> }

const schema = z.object({
  userIds: z.array(z.string()).min(1).max(50),
})

export async function POST(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id: teamId } = await params

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  if (team.ownerId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { userIds } = parsed.data

  // Check existing members to avoid duplicates
  const existing = await prisma.teamMembership.findMany({
    where: { teamId, userId: { in: userIds } },
    select: { userId: true },
  })
  const existingIds = new Set(existing.map((m) => m.userId))
  const toAdd = userIds.filter((id) => !existingIds.has(id))

  if (toAdd.length === 0) {
    return NextResponse.json({ error: 'All selected players are already on the team' }, { status: 409 })
  }

  await prisma.teamMembership.createMany({
    data: toAdd.map((userId) => ({
      teamId,
      userId,
      role: 'PLAYER',
      status: 'ACTIVE',
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({ added: toAdd.length }, { status: 201 })
}
