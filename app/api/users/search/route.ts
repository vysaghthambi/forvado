import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const { error } = await getSessionUser()
  if (error) return error

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ users: [] })

  const users = await prisma.user.findMany({
    where: {
      profileComplete: true,
      OR: [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, displayName: true, email: true, avatarUrl: true, role: true },
    take: 10,
    orderBy: { displayName: 'asc' },
  })

  return NextResponse.json({ users })
}
