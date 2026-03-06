import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ user: dbUser })
}

const updateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']).optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  const updated = await prisma.user.update({
    where: { authId: user.id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  })

  return NextResponse.json({ user: updated })
}
