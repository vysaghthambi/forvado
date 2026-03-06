import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findOrCreateUser } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // Ensure a DB user record exists
  const dbUser = await findOrCreateUser(user.id, user.email)

  // New users go to setup wizard; existing complete users go to intended path
  if (!dbUser.profileComplete) {
    return NextResponse.redirect(`${origin}/setup`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
