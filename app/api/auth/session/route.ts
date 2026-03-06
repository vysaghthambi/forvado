import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user: dbUser })
}
