import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const setupSchema = z.object({
  displayName: z.string().min(2).max(50),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
  jerseyNumber: z.number().int().min(1).max(99),
  dateOfBirth: z.string().datetime().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = setupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { displayName, position, jerseyNumber, dateOfBirth, avatarUrl } = parsed.data

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { authId: user.id },
    data: {
      displayName,
      position,
      jerseyNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      avatarUrl: avatarUrl ?? null,
      profileComplete: true,
    },
  })

  return NextResponse.json({ user: updated })
}
