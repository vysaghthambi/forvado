import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, requireAdmin } from '@/lib/rbac'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  format: z.enum(['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT']),
  startDate: z.string(),
  endDate: z.string(),
  venue: z.string().optional(),
  maxTeams: z.string(),
  matchTime: z.string().optional(),
  playingMembers: z.string().optional(),
  maxSubstitutes: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const { user, error } = await getSessionUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const format = searchParams.get('format') ?? undefined
  const search = searchParams.get('q') ?? undefined

  const tournaments = await prisma.tournament.findMany({
    where: {
      deletedAt: null,
      isPublished: user.role === 'ADMIN' || user.role === 'COORDINATOR' ? undefined : true,
      ...(status ? { status: status as never } : {}),
      ...(format ? { format: format as never } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      createdBy: { select: { id: true, displayName: true } },
      _count: { select: { teams: true, matches: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json({ tournaments })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const d = parsed.data
  const maxTeamsInt = parseInt(d.maxTeams)

  if (d.teamIds && d.teamIds.length !== maxTeamsInt) {
    return NextResponse.json({ error: `Expected ${maxTeamsInt} teams, got ${d.teamIds.length}` }, { status: 400 })
  }

  const tournament = await prisma.$transaction(async (tx) => {
    const t = await tx.tournament.create({
      data: {
        name: d.name,
        description: d.description,
        format: d.format,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
        venue: d.venue,
        maxTeams: maxTeamsInt,
        matchTime: d.matchTime ? parseInt(d.matchTime) : 90,
        playingMembers: d.playingMembers ? parseInt(d.playingMembers) : 11,
        maxSubstitutes: d.maxSubstitutes ? parseInt(d.maxSubstitutes) : 5,
        createdById: user.id,
      },
    })

    if (d.teamIds && d.teamIds.length > 0) {
      await tx.tournamentTeam.createMany({
        data: d.teamIds.map((teamId) => ({ tournamentId: t.id, teamId })),
        skipDuplicates: true,
      })
    }

    return t
  })

  return NextResponse.json({ tournament }, { status: 201 })
}
