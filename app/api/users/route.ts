import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

export async function GET(request: Request) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(200, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit
  const q = searchParams.get('q')?.trim() || undefined
  const role = searchParams.get('role')?.trim() || undefined

  const where = {
    ...(q && {
      OR: [
        { displayName: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
    ...(role && { role: role as import('@prisma/client').Role }),
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        position: true,
        jerseyNumber: true,
        avatarUrl: true,
        profileComplete: true,
        createdAt: true,
        _count: { select: { teamMemberships: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  void admin // caller authenticated

  return NextResponse.json({ users, total, page, limit })
}
