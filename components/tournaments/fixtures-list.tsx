'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format, isToday, isTomorrow, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

const LIVE_STATUSES = new Set([
  'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF',
  'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF',
  'PENALTY_SHOOTOUT',
])
const COMPLETED_STATUSES = new Set(['COMPLETED', 'FULL_TIME', 'EXTRA_TIME_FULL_TIME'])

const STATUS_BADGE_CLASS: Record<string, string> = {
  SCHEDULED: 'bg-muted text-muted-foreground',
  FIRST_HALF: 'bg-green-500/20 text-green-400',
  HALF_TIME: 'bg-amber-500/20 text-amber-400',
  SECOND_HALF: 'bg-green-500/20 text-green-400',
  FULL_TIME: 'bg-muted text-muted-foreground',
  EXTRA_TIME_FIRST_HALF: 'bg-orange-500/20 text-orange-400',
  EXTRA_TIME_HALF_TIME: 'bg-amber-500/20 text-amber-400',
  EXTRA_TIME_SECOND_HALF: 'bg-orange-500/20 text-orange-400',
  EXTRA_TIME_FULL_TIME: 'bg-muted text-muted-foreground',
  PENALTY_SHOOTOUT: 'bg-red-500/20 text-red-400',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive/20 text-destructive',
  POSTPONED: 'bg-muted text-muted-foreground',
}

interface MatchTeam { id: string; name: string; badgeUrl: string | null }
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
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMMM d')
}

function groupByDate(matches: Match[]): { label: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>()

  // Sort: live first, then by scheduledAt
  const sorted = [...matches].sort((a, b) => {
    const aLive = LIVE_STATUSES.has(a.status) ? 0 : 1
    const bLive = LIVE_STATUSES.has(b.status) ? 0 : 1
    if (aLive !== bLive) return aLive - bLive
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  })

  for (const m of sorted) {
    const date = startOfDay(new Date(m.scheduledAt))
    let label: string
    if (COMPLETED_STATUSES.has(m.status) || LIVE_STATUSES.has(m.status)) {
      label = getDateLabel(date)
    } else {
      // For scheduled upcoming, also group by date
      label = getDateLabel(date)
    }
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(m)
  }

  return Array.from(map.entries()).map(([label, ms]) => ({ label, matches: ms }))
}

function formatStatusLabel(s: string) {
  if (LIVE_STATUSES.has(s)) return '● LIVE'
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FixturesList({ matches, showGroup = false }: Props) {
  if (matches.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No fixtures yet.</p>
  }

  const groups = groupByDate(matches)

  return (
    <div className="space-y-5">
      {groups.map(({ label, matches: groupMatches }) => (
        <div key={label}>
          {/* Date heading */}
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
            {label}
          </p>

          <div className="space-y-2">
            {groupMatches.map((m) => {
              const live = LIVE_STATUSES.has(m.status)
              const scored = live || COMPLETED_STATUSES.has(m.status)

              return (
                <Link key={m.id} href={`/matches/${m.id}`} className="block">
                  <div
                    className={cn(
                      'rounded-xl border border-border/50 bg-card p-3.5 hover:bg-card/80 transition-colors',
                      live && 'border-l-[3px] border-l-green-500'
                    )}
                  >
                    {/* Teams + score row */}
                    <div className="flex items-center gap-3">
                      {/* Home */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <span className="text-sm font-semibold truncate text-right">{m.homeTeam.name}</span>
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={m.homeTeam.badgeUrl ?? ''} />
                          <AvatarFallback className="text-xs">{m.homeTeam.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Score / time */}
                      <div className="flex flex-col items-center shrink-0 w-20">
                        {scored ? (
                          <span className="text-lg font-black tabular-nums">
                            {m.homeScore} – {m.awayScore}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-muted-foreground">
                            {format(new Date(m.scheduledAt), 'HH:mm')}
                          </span>
                        )}
                        <span
                          className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            STATUS_BADGE_CLASS[m.status] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {formatStatusLabel(m.status)}
                        </span>
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={m.awayTeam.badgeUrl ?? ''} />
                          <AvatarFallback className="text-xs">{m.awayTeam.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold truncate">{m.awayTeam.name}</span>
                      </div>
                    </div>

                    {/* Badges row */}
                    {(m.round || (showGroup && m.group)) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.round && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">{m.round}</Badge>
                        )}
                        {showGroup && m.group && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            Group {m.group.name}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
