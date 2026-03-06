import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

export async function GET(request: Request) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
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
      },
    }),
    prisma.user.count(),
  ])

  void admin // caller authenticated

  return NextResponse.json({ users, total, page, limit })
}
