import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { Role, User } from '@prisma/client'

export type { Role }

/**
 * Hierarchy: ADMIN > TEAM_OWNER > PLAYER
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  PLAYER: 0,
  TEAM_OWNER: 1,
  ADMIN: 2,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Use inside Route Handlers to get the authenticated DB user.
 * Returns { user } on success or a NextResponse error to return early.
 */
export async function getSessionUser(): Promise<
  { user: User; error: null } | { user: null; error: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } })

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user, error: null }
}

/**
 * Like getSessionUser() but additionally enforces a minimum role.
 * Returns 403 if the user's role is insufficient.
 */
export async function requireRole(
  minimumRole: Role
): Promise<{ user: User; error: null } | { user: null; error: NextResponse }> {
  const result = await getSessionUser()
  if (result.error) return result

  if (!hasRole(result.user.role, minimumRole)) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return result
}

/**
 * Convenience wrappers for common role checks.
 */
export const requireAdmin = () => requireRole('ADMIN')
export const requireTeamOwner = () => requireRole('TEAM_OWNER')
export const requirePlayer = () => requireRole('PLAYER')
