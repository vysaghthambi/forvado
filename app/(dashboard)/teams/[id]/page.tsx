import { requireUser } from '@/lib/auth'
import { getTeamWithDetails } from '@/services/teams'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TeamRoster } from '@/components/teams/team-roster'
import { InvitePlayerDialog } from '@/components/teams/invite-player-dialog'
import { JoinRequestButton } from '@/components/teams/join-request-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Settings, Users } from 'lucide-react'

export const metadata = { title: 'Team — Forvado' }

type Props = { params: Promise<{ id: string }> }

export default async function TeamDetailPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params

  const team = await getTeamWithDetails(id)
  if (!team) notFound()

  const isOwner = team.ownerId === user.id
  const isMember = team.members.some((m) => m.userId === user.id && m.status === 'ACTIVE')

  const pending = await prisma.teamInvitation.findFirst({
    where: { teamId: id, userId: user.id, status: 'PENDING' },
    select: { id: true, type: true },
  })

  const memberCount = team.members.length

  return (
    <div className="space-y-6">
      {/* Back */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />Back to Teams
          </Link>
        </Button>
      </div>

      {/* Header card */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {/* Colour accent strip */}
        <div
          className="h-1.5 w-full"
          style={{ background: team.homeColour ?? 'hsl(var(--primary))' }}
        />

        <div className="p-5">
          {/* Badge + info */}
          <div className="flex items-start gap-4">
            {/* Large badge */}
            <div className="relative shrink-0">
              {team.homeColour && (
                <div
                  className="absolute -inset-0.5 rounded-2xl opacity-50"
                  style={{ background: `linear-gradient(135deg, ${team.homeColour}, ${team.awayColour ?? team.homeColour})` }}
                />
              )}
              <Avatar className="relative h-20 w-20 rounded-2xl">
                <AvatarImage src={team.badgeUrl ?? ''} alt={team.name} />
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-xl">
                  {team.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold truncate">{team.name}</h1>
                {team.isAcceptingRequests && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Open to Join
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {memberCount} member{memberCount !== 1 ? 's' : ''} &nbsp;·&nbsp; by {team.owner.displayName}
              </p>
              {team.description && (
                <p className="mt-2 text-sm text-muted-foreground italic">{team.description}</p>
              )}
            </div>
          </div>

          {/* Owner/member actions */}
          {(isOwner || (!isOwner && !isMember)) && (
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap gap-2">
              {isOwner && (
                <>
                  <InvitePlayerDialog teamId={id} />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/teams/${id}/invitations`}>Requests</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/teams/${id}/edit`}>
                      <Settings className="h-3.5 w-3.5 mr-1.5" />Settings
                    </Link>
                  </Button>
                </>
              )}
              {!isOwner && !isMember && (
                <JoinRequestButton
                  teamId={id}
                  isAccepting={team.isAcceptingRequests}
                  existingPending={!!pending}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          Roster
        </h2>
        <TeamRoster
          teamId={id}
          members={team.members.map((m) => ({
            userId: m.userId,
            role: m.role,
            jerseyNumber: m.jerseyNumber,
            user: m.user,
          }))}
          isOwner={isOwner}
          ownerId={team.ownerId}
        />
      </div>
    </div>
  )
}
