import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { getTeamWithDetails } from '@/services/teams'

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(500).nullable().optional(),
  homeColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  shortCode: z.string().min(2).max(3).regex(/^[A-Z]{2,3}$/).nullable().optional(),
  badgeUrl: z.string().url().nullable().optional(),
  isAcceptingRequests: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const team = await getTeamWithDetails(id)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  return NextResponse.json({ team })
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const team = await prisma.team.findUnique({ where: { id, deletedAt: null } })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  if (team.ownerId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.team.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ team: updated })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const team = await prisma.team.findUnique({ where: { id, deletedAt: null } })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  if (team.ownerId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.team.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}
