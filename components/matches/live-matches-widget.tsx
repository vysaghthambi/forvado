'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMatchTimer } from '@/hooks/use-match-timer'
import { cn } from '@/lib/utils'

interface LiveMatch {
  id: string
  status: string
  homeScore: number
  awayScore: number
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
  homeTeam: { id: string; name: string; badgeUrl: string | null }
  awayTeam: { id: string; name: string; badgeUrl: string | null }
  tournament: { id: string; name: string }
}

const LIVE_STATUSES = ['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF', 'PENALTY_SHOOTOUT']

function LiveMatchRow({ match }: { match: LiveMatch }) {
  const { display, isLive } = useMatchTimer(match)
  return (
    <Link href={`/matches/${match.id}`} className="block">
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 hover:border-border transition-colors">
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-sm font-medium truncate text-right">{match.homeTeam.name}</span>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={match.homeTeam.badgeUrl ?? ''} />
            <AvatarFallback className="text-xs">{match.homeTeam.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-col items-center shrink-0 w-24">
          <span className="text-base font-black tabular-nums">{match.homeScore} – {match.awayScore}</span>
          <div className="flex items-center gap-1">
            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
            <span className={cn('text-[10px] font-semibold uppercase', isLive ? 'text-green-400' : 'text-muted-foreground')}>
              {display}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground truncate max-w-[5rem] text-center">{match.tournament.name}</span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={match.awayTeam.badgeUrl ?? ''} />
            <AvatarFallback className="text-xs">{match.awayTeam.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{match.awayTeam.name}</span>
        </div>
      </div>
    </Link>
  )
}

export function LiveMatchesWidget() {
  const [matches, setMatches] = useState<LiveMatch[]>([])

  const fetchLive = useCallback(async () => {
    const res = await fetch('/api/matches/live')
    if (!res.ok) return
    const data = await res.json()
    setMatches(data.matches ?? [])
  }, [])

  useEffect(() => { fetchLive() }, [fetchLive])

  // Subscribe to any match status changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('live-matches-widget')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
      }, fetchLive)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLive])

  if (matches.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">Live Now</h2>
      </div>
      <div className="space-y-2">
        {matches.map((m) => <LiveMatchRow key={m.id} match={m} />)}
      </div>
    </div>
  )
}
