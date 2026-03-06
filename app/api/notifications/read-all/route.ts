import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'

export async function POST(_req: Request) {
  const { user, error } = await getSessionUser()
  if (error) return error

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
