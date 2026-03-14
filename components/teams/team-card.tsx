import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
    <Link href={`/teams/${team.id}`} className="block">
      <div className="group flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/40 transition-colors">
        {/* Accent strip using home colour */}
        <div
          className="h-1 w-full"
          style={{ background: team.homeColour ?? 'hsl(var(--primary))' }}
        />

        <div className="flex flex-col gap-3 p-4">
          {/* Badge + name */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 rounded-xl shrink-0">
              <AvatarImage src={team.badgeUrl ?? ''} alt={team.name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
                {team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight truncate">{team.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                by {team.owner.displayName}
              </p>
            </div>
          </div>

          {team.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{team.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {team._count.members} member{team._count.members !== 1 ? 's' : ''}
            </span>
            {team.isAcceptingRequests && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Open
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
