'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useMatchTimer } from '@/hooks/use-match-timer'

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
  homeTeam: { id: string; name: string; badgeUrl: string | null; homeColour: string | null; shortCode?: string | null }
  awayTeam: { id: string; name: string; badgeUrl: string | null; homeColour: string | null; shortCode?: string | null }
  tournament: { id: string; name: string }
  round: string | null
}

function TeamBadge({ team }: { team: { name: string; badgeUrl: string | null; homeColour: string | null; shortCode?: string | null } }) {
  const colour = team.homeColour ?? '#2d3050'
  const bg = colour + '33' // ~20% alpha
  const initials = team.shortCode ?? team.name.slice(0, 3).toUpperCase()
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: bg,
        border: `1px solid ${colour}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
        fontSize: 9,
        fontWeight: 700,
        color: colour,
        letterSpacing: '0.5px',
      }}
    >
      {initials}
    </div>
  )
}

function LiveMatchRow({ match }: { match: LiveMatch }) {
  const { display, isLive } = useMatchTimer(match)
  const isCompleted = match.status === 'COMPLETED' || match.status === 'FT'

  return (
    <Link href={`/matches/${match.id}`} className="block no-underline group">
      <div
        className="group-hover:bg-white/[0.025] transition-colors"
        style={{ padding: '12px 15px', borderBottom: '1px solid rgba(35,38,56,.5)' }}
      >
        {/* Match meta row */}
        <div
          className="flex items-center gap-[6px]"
          style={{ marginBottom: 8 }}
        >
          {isLive && (
            <span
              className="animate-pulse"
              style={{
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--live)',
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: isLive ? 'var(--live)' : 'var(--muted-clr)',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            }}
          >
            {isLive ? `LIVE · ${display}` : display}
          </span>
          {match.tournament.name && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: 'var(--muted-clr)', letterSpacing: '0.3px' }} className="truncate">
                {match.tournament.name}{match.round ? ` · ${match.round}` : ''}
              </span>
            </>
          )}
        </div>

        {/* Teams + score row */}
        <div className="flex items-center gap-2">
          {/* Home team */}
          <div className="flex items-center gap-[7px] flex-1 min-w-0 justify-end">
            <span
              className="truncate text-right"
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}
            >
              {match.homeTeam.name}
            </span>
            <TeamBadge team={match.homeTeam} />
          </div>

          {/* Score box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${isLive ? 'var(--live)' : 'var(--border)'}`,
              background: isLive ? 'var(--live-dim)' : 'var(--bg2)',
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: isLive ? 'var(--live)' : 'var(--text)',
              lineHeight: 1,
              letterSpacing: '1px',
            }}
          >
            <span>{match.homeScore}</span>
            <span style={{ fontSize: 14, color: 'var(--muted-clr)', fontWeight: 400 }}>–</span>
            <span>{match.awayScore}</span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-[7px] flex-1 min-w-0">
            <TeamBadge team={match.awayTeam} />
            <span
              className="truncate"
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}
            >
              {match.awayTeam.name}
            </span>
          </div>
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: 'status=in.(FIRST_HALF,HALF_TIME,SECOND_HALF,EXTRA_TIME_FIRST_HALF,EXTRA_TIME_HALF_TIME,EXTRA_TIME_SECOND_HALF,PENALTY_SHOOTOUT)' }, fetchLive)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLive])

  const liveCount = matches.filter((m) => m.status !== 'COMPLETED').length

  return (
    <div
      className="overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between gap-2"
        style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.5px',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}
          >
            Live Matches
          </span>
          {liveCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: 'var(--live)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '0 5px',
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              }}
            >
              {liveCount}
            </span>
          )}
        </div>
      </div>

      {/* Match rows */}
      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-2" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 28, opacity: 0.35 }}>⚽</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No live matches right now.</span>
        </div>
      ) : (
        <div>
          {matches.map((m, i) => {
            const isLast = i === matches.length - 1
            return (
              <div key={m.id} style={isLast ? { borderBottom: 'none' } : undefined}>
                <LiveMatchRow match={m} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
