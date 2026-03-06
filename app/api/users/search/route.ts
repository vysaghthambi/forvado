import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTeamOwner } from '@/lib/rbac'

export async function GET(request: Request) {
  const { error } = await requireTeamOwner()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] })
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
      profileComplete: true,
    },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      position: true,
      jerseyNumber: true,
    },
    take: 10,
    orderBy: { displayName: 'asc' },
  })

  return NextResponse.json({ users })
}
