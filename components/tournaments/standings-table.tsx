import type { StandingRow } from '@/services/standings'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const MEDALS = ['🥇', '🥈', '🥉']

const ROW_BG: Record<number, string> = {
  0: 'bg-yellow-500/5',
  1: 'bg-slate-400/5',
  2: 'bg-orange-600/5',
}

interface Props {
  rows: StandingRow[]
  title?: string
  promotionSpots?: number
}

export function StandingsTable({ rows, title, promotionSpots = 0 }: Props) {
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          {title}
        </h3>
      )}

      <div className="rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[28px_1fr_repeat(7,auto)] text-[11px] text-muted-foreground font-semibold px-4 py-2 border-b border-border/30 gap-x-3 bg-muted/20">
          <span />
          <span>Team</span>
          <span className="text-center w-6">P</span>
          <span className="text-center w-6">W</span>
          <span className="text-center w-6">D</span>
          <span className="text-center w-6">L</span>
          <span className="text-center w-8">GF</span>
          <span className="text-center w-8">GA</span>
          <span className="text-center w-8 text-foreground font-bold">Pts</span>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No standings yet.</p>
        ) : (
          rows.map((row, i) => {
            const isPromoted = promotionSpots > 0 && i < promotionSpots
            const isLastPromoted = promotionSpots > 0 && i === promotionSpots - 1
            const medal = MEDALS[i]
            const gd = row.goalsFor - row.goalsAgainst

            return (
              <div key={row.teamId}>
                <div
                  className={cn(
                    'grid grid-cols-[28px_1fr_repeat(7,auto)] items-center px-4 py-2.5 gap-x-3 transition-colors hover:bg-muted/20',
                    ROW_BG[i] ?? '',
                    isPromoted && 'border-l-2 border-l-primary',
                    !isPromoted && 'border-l-2 border-l-transparent',
                    i < rows.length - 1 && 'border-b border-border/20'
                  )}
                >
                  {/* Rank / medal */}
                  <div className="text-sm text-center">
                    {medal ?? (
                      <span className="text-xs text-muted-foreground font-semibold">{i + 1}</span>
                    )}
                  </div>

                  {/* Team */}
                  <div className="flex items-center gap-2 min-w-0">
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

                {/* Promotion zone divider */}
                {isLastPromoted && i < rows.length - 1 && (
                  <div className="relative h-px bg-primary/30 mx-4">
                    <span className="absolute right-0 -top-2 text-[9px] text-primary font-semibold bg-card px-1">
                      Top {promotionSpots} advance
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
