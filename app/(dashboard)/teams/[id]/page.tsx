import { requireUser } from '@/lib/auth'
import { getTeamWithDetails } from '@/services/teams'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TeamRoster } from '@/components/teams/team-roster'
import { InvitePlayerDialog } from '@/components/teams/invite-player-dialog'
import { JoinRequestButton } from '@/components/teams/join-request-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  // Check for existing pending invitation/request for current user
  const pending = await prisma.teamInvitation.findFirst({
    where: { teamId: id, userId: user.id, status: 'PENDING' },
    select: { id: true, type: true },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="icon" className="mt-1 h-8 w-8 shrink-0">
          <Link href="/teams"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>

        <div className="flex flex-1 items-start gap-4">
          {/* Colour strip + badge */}
          <div className="relative">
            {team.homeColour && (
              <div className="absolute -inset-0.5 rounded-xl opacity-60" style={{ background: `linear-gradient(135deg, ${team.homeColour}, ${team.awayColour ?? team.homeColour})` }} />
            )}
            <Avatar className="relative h-16 w-16 rounded-xl">
              <AvatarImage src={team.badgeUrl ?? ''} alt={team.name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-lg">
                {team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{team.name}</h1>
              {team.isAcceptingRequests && (
                <Badge variant="outline" className="border-primary/40 text-primary text-xs">Open</Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <Users className="inline h-3.5 w-3.5 mr-1" />
              {team.members.length} member{team.members.length !== 1 ? 's' : ''} · by {team.owner.displayName}
            </p>
            {team.description && (
              <p className="mt-2 text-sm text-muted-foreground">{team.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-2">
            {isOwner && (
              <>
                <InvitePlayerDialog teamId={id} />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/teams/${id}/invitations`}>Requests</Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <Link href={`/teams/${id}/edit`}><Settings className="h-4 w-4" /></Link>
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roster">
        <TabsList className="bg-muted/40">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="roster" className="mt-4">
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
        </TabsContent>

        {isOwner && (
          <TabsContent value="settings" className="mt-4">
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <p className="text-sm text-muted-foreground">Team settings coming soon.</p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
