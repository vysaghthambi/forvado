import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

const schema = z.object({
  role: z.enum(['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN']),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
  })

  return NextResponse.json({ user: updated })
}
