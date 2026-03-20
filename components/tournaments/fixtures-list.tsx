'use client'

import Link from 'next/link'
import { format, isToday, isTomorrow, startOfDay } from 'date-fns'
import { MATCH_STATUS_LABEL } from '@/lib/labels'

const LIVE_STATUSES = new Set([
  'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF',
  'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF',
  'PENALTY_SHOOTOUT',
])
const COMPLETED_STATUSES = new Set(['COMPLETED', 'FULL_TIME', 'EXTRA_TIME_FULL_TIME'])

interface MatchTeam {
  id: string
  name: string
  badgeUrl: string | null
  homeColour?: string | null
}

interface Match {
  id: string
  matchOrder: number
  round: string | null
  scheduledAt: string | Date
  venue: string | null
  status: string
  homeScore: number
  awayScore: number
  homeTeam: MatchTeam
  awayTeam: MatchTeam
  group?: { id: string; name: string } | null
}

interface Props {
  matches: Match[]
  showGroup?: boolean
  noGroup?: boolean
  /** Strip outer card wrapper (use when already inside a card) */
  naked?: boolean
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMMM d')
}

function groupByDate(matches: Match[]): { label: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>()
  const sorted = [...matches].sort((a, b) => {
    const aLive = LIVE_STATUSES.has(a.status) ? 0 : 1
    const bLive = LIVE_STATUSES.has(b.status) ? 0 : 1
    if (aLive !== bLive) return aLive - bLive
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  })
  for (const m of sorted) {
    const label = getDateLabel(startOfDay(new Date(m.scheduledAt)))
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(m)
  }
  return Array.from(map.entries()).map(([label, ms]) => ({ label, matches: ms }))
}

function TeamBadge({ team }: { team: MatchTeam }) {
  const colour = team.homeColour ?? '#2d3050'
  const bg = colour + '33'
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
      background: bg, border: `1px solid ${colour}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
      fontSize: 9, fontWeight: 700, color: colour, letterSpacing: '0.5px',
    }}>
      {team.name.slice(0, 3).toUpperCase()}
    </div>
  )
}

function MatchItem({ m, isLast, showGroup }: { m: Match; isLast: boolean; showGroup: boolean }) {
  const isLive = LIVE_STATUSES.has(m.status)
  const isCompleted = COMPLETED_STATUSES.has(m.status)
  const isScheduled = !isLive && !isCompleted

  const metaText = isLive
    ? MATCH_STATUS_LABEL[m.status] ?? m.status
    : isCompleted
    ? MATCH_STATUS_LABEL[m.status] ?? 'Full Time'
    : format(new Date(m.scheduledAt), 'h:mm a')

  const roundLabel = [
    showGroup && m.group ? `Group ${m.group.name}` : null,
    m.round ?? null,
  ].filter(Boolean).join(' · ')

  return (
    <Link href={`/matches/${m.id}`} className="block no-underline group">
      <div
        className="group-hover:bg-white/[0.025] transition-colors"
        style={{ padding: '12px 15px', borderBottom: isLast ? 'none' : '1px solid rgba(35,38,56,.5)' }}
      >
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {isLive && (
            <span
              className="animate-pulse"
              style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--live)', flexShrink: 0 }}
            />
          )}
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: isLive ? 'var(--live)' : 'var(--muted-clr)',
            textTransform: 'uppercase', letterSpacing: '0.4px',
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          }}>
            {isLive ? `LIVE · ${metaText}` : metaText}
          </span>
          {roundLabel && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--muted-clr)' }}>{roundLabel}</span>
            </>
          )}
        </div>

        {/* Teams + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Home */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textAlign: 'right' }} className="truncate">
              {m.homeTeam.name}
            </span>
            <TeamBadge team={m.homeTeam} />
          </div>

          {/* Score box */}
          {isScheduled ? (
            <div style={{
              flexShrink: 0, padding: '4px 10px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontSize: 13, fontWeight: 600, color: 'var(--muted-clr)',
              letterSpacing: '1px',
            }}>
              vs
            </div>
          ) : (
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 6,
              border: `1px solid ${isLive ? 'var(--live)' : 'var(--border)'}`,
              background: isLive ? 'var(--live-dim)' : 'var(--bg2)',
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontSize: 18, fontWeight: 700,
              color: isLive ? 'var(--live)' : 'var(--text)',
              lineHeight: 1, letterSpacing: '1px',
            }}>
              <span>{m.homeScore}</span>
              <span style={{ fontSize: 14, color: 'var(--muted-clr)', fontWeight: 400 }}>–</span>
              <span>{m.awayScore}</span>
            </div>
          )}

          {/* Away */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
            <TeamBadge team={m.awayTeam} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }} className="truncate">
              {m.awayTeam.name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function FixturesList({ matches, showGroup = false, noGroup = false, naked = false }: Props) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2" style={{ padding: '36px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 28, opacity: 0.35 }}>📅</span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No fixtures yet.</span>
      </div>
    )
  }

  if (noGroup) {
    const sorted = [...matches].sort((a, b) => {
      const aLive = LIVE_STATUSES.has(a.status) ? 0 : 1
      const bLive = LIVE_STATUSES.has(b.status) ? 0 : 1
      if (aLive !== bLive) return aLive - bLive
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    })
    const inner = sorted.map((m, i) => (
      <MatchItem key={m.id} m={m} isLast={i === sorted.length - 1} showGroup={showGroup} />
    ))
    if (naked) return <div>{inner}</div>
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {inner}
      </div>
    )
  }

  const groups = groupByDate(matches)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map(({ label, matches: groupMatches }) => (
        <div key={label}>
          {/* Date label */}
          <div style={{
            fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            color: 'var(--muted-clr)',
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            marginBottom: 8, paddingLeft: 2,
          }}>
            {label}
          </div>

          {/* Match cards */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {groupMatches.map((m, i) => (
              <MatchItem key={m.id} m={m} isLast={i === groupMatches.length - 1} showGroup={showGroup} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
