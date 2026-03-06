import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface TeamCardProps {
  team: {
    id: string
    name: string
    badgeUrl: string | null
    homeColour: string | null
    description: string | null
    isAcceptingRequests: boolean
    owner: { displayName: string; avatarUrl: string | null }
    _count: { members: number }
  }
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`}>
      <div className="group relative flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/40 hover:bg-card/80">
        {/* Accent strip using home colour */}
        {team.homeColour && (
          <div
            className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl"
            style={{ backgroundColor: team.homeColour }}
          />
        )}

        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={team.badgeUrl ?? ''} alt={team.name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-sm">
              {team.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{team.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              by {team.owner.displayName}
            </p>
          </div>

          {team.isAcceptingRequests && (
            <Badge variant="outline" className="shrink-0 border-primary/40 text-primary text-xs">
              Open
            </Badge>
          )}
        </div>

        {team.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{team.description}</p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{team._count.members} member{team._count.members !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </Link>
  )
}
