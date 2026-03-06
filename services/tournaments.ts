import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

export async function getTournamentWithDetails(id: string) {
  return prisma.tournament.findUnique({
    where: { id, deletedAt: null },
    include: {
      createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
      groups: { orderBy: { name: 'asc' } },
      teams: {
        include: {
          team: { select: { id: true, name: true, badgeUrl: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: { registeredAt: 'asc' },
      },
      coordinators: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } },
      },
      _count: { select: { matches: true } },
    },
  })
}

export async function isTournamentCoordinator(tournamentId: string, userId: string) {
  const c = await prisma.tournamentCoordinator.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: { id: true },
  })
  return !!c
}

export async function canManageTournament(
  tournamentId: string,
  userId: string,
  userRole: Role
): Promise<boolean> {
  if (userRole === 'ADMIN') return true
  if (userRole === 'COORDINATOR') return isTournamentCoordinator(tournamentId, userId)
  return false
}
