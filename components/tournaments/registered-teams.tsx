import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface TTeam {
  team: { id: string; name: string; badgeUrl: string | null }
  group?: { id: string; name: string } | null
}

interface Props {
  teams: TTeam[]
  emptyLabel?: string
}

export function RegisteredTeams({ teams, emptyLabel = 'No teams registered yet.' }: Props) {
  if (teams.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">{emptyLabel}</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {teams.map(({ team, group }) => (
        <Link key={team.id} href={`/teams/${team.id}`}>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-border transition-colors">
            <Avatar className="h-9 w-9">
              <AvatarImage src={team.badgeUrl ?? ''} />
              <AvatarFallback className="text-sm">{team.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{team.name}</p>
              {group && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1 mt-0.5">Group {group.name}</Badge>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
