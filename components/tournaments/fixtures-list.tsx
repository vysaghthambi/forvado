'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Calendar } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
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

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FixturesList({ matches, showGroup = false }: Props) {
  if (matches.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No fixtures yet.</p>
  }

  const isLive = (s: string) => ['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_HALF_TIME', 'EXTRA_TIME_SECOND_HALF', 'PENALTY_SHOOTOUT'].includes(s)
  const isCompleted = (s: string) => ['COMPLETED', 'FULL_TIME', 'EXTRA_TIME_FULL_TIME'].includes(s)

  return (
    <div className="space-y-2">
      {matches.map((m) => (
        <Link key={m.id} href={`/matches/${m.id}`} className="block">
        <div className="rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors">
          <div className="flex items-center gap-3">
            {/* Home Team */}
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
              <span className="text-sm font-medium truncate text-right">{m.homeTeam.name}</span>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={m.homeTeam.badgeUrl ?? ''} />
                <AvatarFallback className="text-xs">{m.homeTeam.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>

            {/* Score / Time */}
            <div className="flex flex-col items-center shrink-0 w-20">
              {isCompleted(m.status) || isLive(m.status) ? (
                <span className="text-lg font-bold tabular-nums">{m.homeScore} – {m.awayScore}</span>
              ) : (
                <span className="text-sm text-muted-foreground">{format(new Date(m.scheduledAt), 'HH:mm')}</span>
              )}
              <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[m.status] ?? 'bg-muted'}`}>
                {isLive(m.status) ? '● LIVE' : formatStatus(m.status)}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={m.awayTeam.badgeUrl ?? ''} />
                <AvatarFallback className="text-xs">{m.awayTeam.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{m.awayTeam.name}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{format(new Date(m.scheduledAt), 'MMM d, yyyy')}
            </span>
            {m.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.venue}</span>}
            {m.round && <Badge variant="outline" className="text-[10px] h-4 px-1">{m.round}</Badge>}
            {showGroup && m.group && <Badge variant="secondary" className="text-[10px] h-4 px-1">Group {m.group.name}</Badge>}
          </div>
        </div>
        </Link>
      ))}
    </div>
  )
}
