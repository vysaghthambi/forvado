import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { User } from '@prisma/client'

/**
 * Returns the current Supabase auth user.
 * Throws if not authenticated.
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }
  return user
}

/**
 * Returns the current DB user record.
 * Redirects to /login if not authenticated, or to /setup if profile incomplete.
 */
export async function requireUser(): Promise<User> {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  let user = await prisma.user.findUnique({ where: { authId: authUser.id } })
  if (!user) {
    if (!authUser.email) redirect('/login')
    user = await findOrCreateUser(authUser.id, authUser.email)
  }

  if (!user.profileComplete) redirect('/setup')

  return user
}

/**
 * Like requireUser() but does NOT redirect to /setup.
 * Used in the setup wizard itself.
 * Auto-creates the DB record if the Supabase session exists but the row is missing
 * (e.g. after a DB reset with an existing auth session).
 */
export async function requireAuth(): Promise<User | null> {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } })
  if (user) return user

  // DB record missing but auth session is valid — recreate it
  if (!authUser.email) redirect('/login')
  return findOrCreateUser(authUser.id, authUser.email)
}

/**
 * Finds or creates a DB User record from a Supabase auth user.
 * Called after OAuth callback.
 */
export async function findOrCreateUser(authId: string, email: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { authId } })
  if (existing) return existing

  return prisma.user.create({
    data: {
      authId,
      email,
      displayName: email.split('@')[0],
      role: 'PLAYER',
      profileComplete: false,
    },
  })
}
