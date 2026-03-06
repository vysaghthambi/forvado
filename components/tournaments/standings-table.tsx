import type { StandingRow } from '@/services/standings'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  rows: StandingRow[]
  title?: string
}

export function StandingsTable({ rows, title }: Props) {
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</h3>}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="grid grid-cols-[1fr_repeat(7,auto)] text-xs text-muted-foreground font-medium px-4 py-2 border-b border-border/30 gap-x-4">
          <span>Team</span>
          <span className="text-center w-6">P</span>
          <span className="text-center w-6">W</span>
          <span className="text-center w-6">D</span>
          <span className="text-center w-6">L</span>
          <span className="text-center w-8">GF</span>
          <span className="text-center w-8">GA</span>
          <span className="text-center w-8 font-bold text-foreground">Pts</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No standings yet.</p>
        ) : (
          rows.map((row, i) => (
            <div key={row.teamId} className="grid grid-cols-[1fr_repeat(7,auto)] items-center px-4 py-2.5 border-b border-border/20 last:border-0 gap-x-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={row.badgeUrl ?? ''} />
                  <AvatarFallback className="text-[10px]">{row.teamName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{row.teamName}</span>
              </div>
              <span className="text-sm text-center w-6">{row.played}</span>
              <span className="text-sm text-center w-6">{row.won}</span>
              <span className="text-sm text-center w-6">{row.drawn}</span>
              <span className="text-sm text-center w-6">{row.lost}</span>
              <span className="text-sm text-center w-8">{row.goalsFor}</span>
              <span className="text-sm text-center w-8">{row.goalsAgainst}</span>
              <span className="text-sm text-center w-8 font-bold text-primary">{row.points}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
