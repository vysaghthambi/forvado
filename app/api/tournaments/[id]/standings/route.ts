import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/rbac'
import { calculateStandings, calculateGroupStandings } from '@/services/standings'
import { prisma } from '@/lib/prisma'

type Props = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { error } = await getSessionUser()
  if (error) return error

  const { id } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { id, deletedAt: null },
    select: { format: true },
  })
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (tournament.format === 'GROUP_KNOCKOUT') {
    const groups = await calculateGroupStandings(id)
    return NextResponse.json({ type: 'group', groups })
  }

  const rows = await calculateStandings(id)
  return NextResponse.json({ type: 'league', rows })
}
