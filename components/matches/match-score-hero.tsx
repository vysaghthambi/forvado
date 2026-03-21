'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMatchTimer } from '@/hooks/use-match-timer'
import Link from 'next/link'
import { format } from 'date-fns'

interface Team {
  id: string
  name: string
  homeColour: string | null
}

interface MatchEvent {
  id: string
  type: string
  minute: number
  team: { id: string; name: string }
  primaryUser: { id: string; displayName: string } | null
  secondaryUser: { id: string; displayName: string } | null
}

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
  venue: string | null
  scheduledAt: string
  homeTeam: Team
  awayTeam: Team
  group?: { name: string } | null
  round?: string | null
}

interface Props {
  initialMatch: MatchData
  initialEvents?: MatchEvent[]
  canManage?: boolean
  compact?: boolean
}

const LIVE_STATUSES = ['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF',
  'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF', 'PENALTY_SHOOTOUT']

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 3).map((w) => w[0]).join('').toUpperCase().slice(0, 3)
}

function getEventStyle(type: string) {
  switch (type) {
    case 'GOAL': case 'EXTRA_TIME_GOAL': return { icon: '⚽', isWarn: false, isSub: false }
    case 'OWN_GOAL': return { icon: '⚽', isWarn: false, isSub: false }
    case 'YELLOW_CARD': case 'SECOND_YELLOW': return { icon: '🟨', isWarn: true, isSub: false }
    case 'RED_CARD': return { icon: '🟥', isWarn: true, isSub: false }
    case 'SUBSTITUTION': return { icon: '↔', isWarn: false, isSub: true }
    default: return { icon: '•', isWarn: false, isSub: false }
  }
}

function tagStyle(color: 'red' | 'muted'): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
    background: color === 'red' ? 'var(--live-dim)' : 'rgba(94,98,128,.15)',
    color: color === 'red' ? 'var(--live)' : 'var(--muted-clr)',
  }
}

function EventRow({ event, side }: { event: MatchEvent; side: 'home' | 'away' }) {
  const { icon, isWarn, isSub } = getEventStyle(event.type)
  const isHome = side === 'home'

  let playerName = ''
  if (event.type === 'SUBSTITUTION' && event.secondaryUser && event.primaryUser) {
    const inName = event.secondaryUser.displayName.split(' ')[0] ?? '?'
    const outName = event.primaryUser.displayName.split(' ')[0] ?? '?'
    playerName = `${inName} ↔ ${outName}`
  } else {
    playerName = event.primaryUser?.displayName.split(' ')[0] ?? '?'
    if (event.type === 'OWN_GOAL') playerName += ' (OG)'
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 12, color: 'var(--text2)', padding: '2px 0',
      flexDirection: isHome ? 'row-reverse' : 'row',
    }}>
      <span style={{
        fontWeight: 500,
        fontSize: isSub ? 11 : 12,
        color: isWarn ? 'var(--accent-clr)' : isSub ? 'var(--blue)' : 'var(--text)',
      }}>
        {playerName}
      </span>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <span style={{
        fontSize: 10, color: 'var(--muted-clr)', fontWeight: 600,
        minWidth: 24, textAlign: isHome ? 'right' : 'left',
      }}>
        {event.minute}&apos;
      </span>
    </div>
  )
}

export function MatchScoreHero({ initialMatch, initialEvents = [], canManage = false, compact = false }: Props) {
  const [match, setMatch] = useState(initialMatch)
  const [events, setEvents] = useState(initialEvents)
  const { display, isLive } = useMatchTimer(match)

  useEffect(() => { setMatch(initialMatch) }, [initialMatch])

  const isLiveStatus = LIVE_STATUSES.includes(match.status)
  const isDone = ['COMPLETED', 'FULL_TIME', 'EXTRA_TIME_FULL_TIME', 'EXTRA_TIME_SECOND_HALF'].includes(match.status)
  const isPSO = match.status === 'PENALTY_SHOOTOUT' || (match.status === 'COMPLETED' && match.homePenaltyScore !== null)

  const refreshMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${initialMatch.id}`)
    if (!res.ok) return
    const data = await res.json()
    setMatch(data.match)
  }, [initialMatch.id])

  const refreshEvents = useCallback(async () => {
    const res = await fetch(`/api/matches/${initialMatch.id}/events`)
    if (!res.ok) return
    const data = await res.json()
    setEvents(data.events)
  }, [initialMatch.id])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`match-hero:${initialMatch.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${initialMatch.id}` }, refreshMatch)
      .on('broadcast', { event: 'PHASE_CHANGE' }, refreshMatch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${initialMatch.id}` }, refreshEvents)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [initialMatch.id, refreshMatch, refreshEvents])

  const homeEvents = events.filter((e) => e.team.id === match.homeTeam.id)
  const awayEvents = events.filter((e) => e.team.id === match.awayTeam.id)

  const homeInitials = getInitials(match.homeTeam.name)
  const awayInitials = getInitials(match.awayTeam.name)
  const homeBg = match.homeTeam.homeColour ?? '#1e3a5f'
  const homeFg = '#7ab4ff'
  const awayBg = match.awayTeam.homeColour ?? '#1a2e1a'
  const awayFg = '#2ddb7f'

  const heroPadding = compact ? '18px 22px' : '22px 22px 0'

  return (
    <div style={{
      background: 'linear-gradient(155deg,#0c1322 0%,#12102a 50%,#0f1a12 100%)',
      border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        padding: heroPadding,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: compact ? 'center' : 'flex-start', gap: 20,
      }}>

        {/* Home team */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0 }}>
          <Link href={`/teams/${match.homeTeam.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: compact ? 0 : 12, cursor: 'pointer' }}>
              <div
                className="w-10 h-10 sm:w-[58px] sm:h-[58px] text-[14px] sm:text-[18px]"
                style={{
                  borderRadius: 13,
                  fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: homeBg, color: homeFg, flexShrink: 0,
                }}
              >
                {homeInitials}
              </div>
              <div className="text-[15px] sm:text-[20px]" style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontWeight: 700, color: 'var(--text)' }}>
                {match.homeTeam.name}
              </div>
              {!compact && (
                <div style={{ fontSize: 11, color: 'var(--muted-clr)' }}>
                  Home{match.group ? ` · Group ${match.group.name}` : ''}
                </div>
              )}
            </div>
          </Link>
          {/* Home events - right aligned */}
          {!compact && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', padding: '0 16px 16px' }}>
              {homeEvents.map((e) => <EventRow key={e.id} event={e} side="home" />)}
            </div>
          )}
        </div>

        {/* Score center */}
        <div style={{ textAlign: 'center', flexShrink: 0, padding: compact ? '0 8px' : '0 8px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
            {isLiveStatus && (
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--live)', display: 'inline-block' }} />
            )}
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: isLiveStatus ? 'var(--live)' : 'var(--muted-clr)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {isLiveStatus
                ? (display || 'Live')
                : match.status === 'COMPLETED' ? 'Full Time'
                : match.status === 'SCHEDULED' ? 'Scheduled'
                : match.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div
            className="text-[38px] sm:text-[52px]"
            style={{
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontWeight: 700, lineHeight: 1,
              color: isDone ? 'var(--text)' : isLiveStatus ? 'var(--live)' : 'var(--text2)',
            }}
          >
            {match.homeScore} – {match.awayScore}
          </div>

          {isPSO && match.homePenaltyScore !== null && (
            <div style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 4 }}>
              ({match.homePenaltyScore} – {match.awayPenaltyScore})
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {isLiveStatus && display && <span style={tagStyle('red')}>{display}</span>}
            {match.round && <span style={tagStyle('muted')}>{match.round}</span>}
          </div>

          {!compact && match.venue && (
            <div style={{ fontSize: 10, color: 'var(--muted-clr)', marginTop: 8 }}>📍 {match.venue}</div>
          )}
          {!compact && (
            <div style={{ fontSize: 10, color: 'var(--muted-clr)', marginTop: 2 }}>
              {format(new Date(match.scheduledAt), 'MMM d, yyyy · HH:mm')}
            </div>
          )}

          {canManage && !compact && (
            <Link href={`/matches/${match.id}/control`} style={{ textDecoration: 'none' }}>
              <button style={{
                marginTop: 14, padding: '5px 12px', borderRadius: 6,
                background: 'var(--accent-clr)', color: '#000',
                fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                ⚙ Control Match
              </button>
            </Link>
          )}
        </div>

        {/* Away team */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0 }}>
          <Link href={`/teams/${match.awayTeam.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: compact ? 0 : 12, cursor: 'pointer' }}>
              <div
                className="w-10 h-10 sm:w-[58px] sm:h-[58px] text-[14px] sm:text-[18px]"
                style={{
                  borderRadius: 13,
                  fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: awayBg, color: awayFg, flexShrink: 0,
                }}
              >
                {awayInitials}
              </div>
              <div className="text-[15px] sm:text-[20px]" style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontWeight: 700, color: 'var(--text)' }}>
                {match.awayTeam.name}
              </div>
              {!compact && (
                <div style={{ fontSize: 11, color: 'var(--muted-clr)' }}>
                  Away{match.group ? ` · Group ${match.group.name}` : ''}
                </div>
              )}
            </div>
          </Link>
          {/* Away events - left aligned */}
          {!compact && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', padding: '0 16px 16px' }}>
              {awayEvents.map((e) => <EventRow key={e.id} event={e} side="away" />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
