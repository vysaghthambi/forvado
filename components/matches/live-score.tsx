'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMatchTimer } from '@/hooks/use-match-timer'
import { cn } from '@/lib/utils'

interface Team { id: string; name: string; badgeUrl: string | null }

interface MatchData {
  id: string
  status: string
  homeScore: number
  awayScore: number
  homePenaltyScore: number | null
  awayPenaltyScore: number | null
  matchTime: number
  firstHalfStartedAt: string | null
  halfTimeAt: string | null
  secondHalfStartedAt: string | null
  fullTimeAt: string | null
  etFirstHalfStartedAt: string | null
  etHalfTimeAt: string | null
  etSecondHalfStartedAt: string | null
  etFullTimeAt: string | null
  penaltyStartedAt: string | null
  completedAt: string | null
  homeTeam: Team
  awayTeam: Team
}

interface Props {
  initialMatch: MatchData
}

const LIVE_STATUSES = ['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF', 'PENALTY_SHOOTOUT']

export function LiveScore({ initialMatch }: Props) {
  const [match, setMatch] = useState(initialMatch)
  const { display, isLive } = useMatchTimer(match)

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/matches/${initialMatch.id}`)
    if (!res.ok) return
    const data = await res.json()
    setMatch(data.match)
  }, [initialMatch.id])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`match:${initialMatch.id}:score`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${initialMatch.id}`,
      }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [initialMatch.id, refresh])

  const isPSO = match.status === 'PENALTY_SHOOTOUT' || match.status === 'COMPLETED' && match.homePenaltyScore !== null

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        {isLive && <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
        <span className={cn('text-xs font-semibold uppercase tracking-widest', isLive ? 'text-green-400' : 'text-muted-foreground')}>
          {display || 'Scheduled'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Avatar className="h-14 w-14">
            <AvatarImage src={match.homeTeam.badgeUrl ?? ''} />
            <AvatarFallback className="text-lg">{match.homeTeam.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold text-center leading-tight">{match.homeTeam.name}</p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center shrink-0">
          <div className="text-5xl font-black tabular-nums tracking-tight">
            {match.homeScore}<span className="text-muted-foreground mx-1">–</span>{match.awayScore}
          </div>
          {isPSO && match.homePenaltyScore !== null && (
            <p className="text-sm text-muted-foreground mt-1">
              ({match.homePenaltyScore} – {match.awayPenaltyScore} pens)
            </p>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Avatar className="h-14 w-14">
            <AvatarImage src={match.awayTeam.badgeUrl ?? ''} />
            <AvatarFallback className="text-lg">{match.awayTeam.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold text-center leading-tight">{match.awayTeam.name}</p>
        </div>
      </div>
    </div>
  )
}
