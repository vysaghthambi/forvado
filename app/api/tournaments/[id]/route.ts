import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/rbac'
import { canManageTournament, getTournamentWithDetails } from '@/services/tournaments'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxTeams: z.string().optional(),
  matchTime: z.string().optional(),
  playingMembers: z.string().optional(),
  maxSubstitutes: z.string().optional(),
})

type Props = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const tournament = await getTournamentWithDetails(id)
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!tournament.isPublished && !(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ tournament })
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  if (!(await canManageTournament(id, user.id, user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const d = parsed.data
  const tournament = await prisma.tournament.update({
    where: { id },
    data: {
      ...(d.name ? { name: d.name } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.venue !== undefined ? { venue: d.venue } : {}),
      ...(d.startDate ? { startDate: new Date(d.startDate) } : {}),
      ...(d.endDate ? { endDate: new Date(d.endDate) } : {}),
      ...(d.maxTeams ? { maxTeams: parseInt(d.maxTeams) } : {}),
      ...(d.matchTime ? { matchTime: parseInt(d.matchTime) } : {}),
      ...(d.playingMembers ? { playingMembers: parseInt(d.playingMembers) } : {}),
      ...(d.maxSubstitutes ? { maxSubstitutes: parseInt(d.maxSubstitutes) } : {}),
    },
  })

  return NextResponse.json({ tournament })
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.tournament.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}
