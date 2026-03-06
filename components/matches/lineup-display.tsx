import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']

interface Player {
  id: string
  jerseyNumber: number
  position: string
  isSubstitute: boolean
  user: { id: string; displayName: string; avatarUrl: string | null }
}

interface TeamLineup {
  teamId: string
  teamName: string
  players: Player[]
}

interface Props {
  home: TeamLineup
  away: TeamLineup
}

function sortPlayers(players: Player[]) {
  return [...players].sort((a, b) => {
    const pi = POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
    return pi !== 0 ? pi : a.jerseyNumber - b.jerseyNumber
  })
}

function TeamList({ lineup, side }: { lineup: TeamLineup; side: 'home' | 'away' }) {
  const starters = sortPlayers(lineup.players.filter((p) => !p.isSubstitute))
  const bench = sortPlayers(lineup.players.filter((p) => p.isSubstitute))
  const align = side === 'home' ? 'items-start' : 'items-end text-right'

  function PlayerRow({ p }: { p: Player }) {
    return (
      <div className={`flex items-center gap-2 py-1.5 ${side === 'away' ? 'flex-row-reverse' : ''}`}>
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={p.user.avatarUrl ?? ''} />
          <AvatarFallback className="text-xs">{p.user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={align}>
          <span className="text-sm font-medium">{p.user.displayName}</span>
          <div className={`flex items-center gap-1 ${side === 'away' ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs text-muted-foreground">#{p.jerseyNumber}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1">{p.position}</Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className={`text-sm font-semibold text-muted-foreground ${side === 'away' ? 'text-right' : ''}`}>{lineup.teamName}</h3>
      {starters.length > 0 ? (
        <div className="space-y-0.5">
          {starters.map((p) => <PlayerRow key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Lineup not submitted</p>
      )}
      {bench.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-3 mb-1">Bench</p>
          <div className="space-y-0.5">
            {bench.map((p) => <PlayerRow key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export function LineupDisplay({ home, away }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <TeamList lineup={home} side="home" />
      <TeamList lineup={away} side="away" />
    </div>
  )
}
