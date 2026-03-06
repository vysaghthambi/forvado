import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'

export async function GET(request: Request) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ])

  return NextResponse.json({ notifications, total, unreadCount, page, limit })
}
