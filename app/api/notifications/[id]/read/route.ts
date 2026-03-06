import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const notification = await prisma.notification.findUnique({ where: { id } })

  if (!notification || notification.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } })
  return NextResponse.json({ notification: updated })
}
