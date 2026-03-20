import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament } from '@/services/tournaments'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

const schema = z.object({
  status: z.enum(['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED']),
})

type Props = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  if (!(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const tournament = await prisma.tournament.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  })

  revalidateTag('tournaments-list', {})
  revalidateTag(`tournament-${id}`, {})
  return NextResponse.json({ tournament })
}
