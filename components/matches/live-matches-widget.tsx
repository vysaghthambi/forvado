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

function LiveMatchRow({ match }: { match: LiveMatch }) {
  const { display, isLive } = useMatchTimer(match)

  return (
    <Link href={`/matches/${match.id}`} className="block">
      <div className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors px-1">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-sm font-semibold truncate text-right">{match.homeTeam.name}</span>
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={match.homeTeam.badgeUrl ?? ''} />
            <AvatarFallback className="text-[10px]">{match.homeTeam.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Score + time */}
        <div className="flex flex-col items-center shrink-0 w-20">
          <span className="text-base font-black tabular-nums">
            {match.homeScore} – {match.awayScore}
          </span>
          <div className="flex items-center gap-1">
            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
            <span className={cn('text-[10px] font-bold uppercase', isLive ? 'text-green-400' : 'text-muted-foreground')}>
              {display}
            </span>
          </div>
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={match.awayTeam.badgeUrl ?? ''} />
            <AvatarFallback className="text-[10px]">{match.awayTeam.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold truncate">{match.awayTeam.name}</span>
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

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('live-matches-widget')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, fetchLive)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLive])

  if (matches.length === 0) return null

  return (
    <div className="rounded-xl border border-green-500/25 bg-gradient-to-br from-green-500/10 to-green-500/5 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-green-400">Live Now</span>
      </div>

      {/* Matches */}
      <div className="divide-y divide-green-500/10">
        {matches.map((m) => (
          <LiveMatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}
