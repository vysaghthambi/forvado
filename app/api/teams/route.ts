import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'

const createSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional().nullable(),
  homeColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour').optional().nullable(),
  shortCode: z.string().min(2).max(3).regex(/^[A-Z]{2,3}$/).optional().nullable(),
  badgeUrl: z.string().url().optional().nullable(),
  isAcceptingRequests: z.boolean().optional(),
})

export async function GET(request: Request) {
  const { error } = await getSessionUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const accepting = searchParams.get('accepting') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit
  const q = searchParams.get('q')?.trim()

  const where = {
    deletedAt: null,
    ...(accepting && { isAcceptingRequests: true }),
    ...(q && { name: { contains: q, mode: 'insensitive' as const } }),
  }

  const [teams, total] = await prisma.$transaction([
    prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.team.count({ where }),
  ])

  return NextResponse.json({ teams, total, page, limit })
}

export async function POST(request: Request) {
  const { user, error } = await getSessionUser()
  if (error) return error

  if (user.role !== 'ADMIN' && user.role !== 'TEAM_OWNER') {
    return NextResponse.json({ error: 'Only admins and team owners can create teams' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const team = await prisma.team.create({
    data: {
      ...parsed.data,
      ownerId: user.id,
    },
  })

  // Auto-add creator as CAPTAIN member
  await prisma.teamMembership.create({
    data: { teamId: team.id, userId: user.id, role: 'CAPTAIN', status: 'ACTIVE' },
  })

  return NextResponse.json({ team }, { status: 201 })
}
