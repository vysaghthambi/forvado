'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const EVENT_ICONS: Record<string, string> = {
  GOAL: '⚽',
  OWN_GOAL: '⚽',
  EXTRA_TIME_GOAL: '⚽',
  YELLOW_CARD: '🟨',
  RED_CARD: '🟥',
  SECOND_YELLOW: '🟨🟥',
  SUBSTITUTION: '🔄',
}

const EVENT_LABELS: Record<string, string> = {
  GOAL: 'Goal',
  OWN_GOAL: 'Own Goal',
  EXTRA_TIME_GOAL: 'Goal (ET)',
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  SECOND_YELLOW: '2nd Yellow',
  SUBSTITUTION: 'Substitution',
}

interface EventUser { id: string; displayName: string }
interface EventTeam { id: string; name: string }

interface MatchEvent {
  id: string
  type: string
  minute: number
  team: EventTeam
  primaryUser: EventUser | null
  secondaryUser: EventUser | null
  notes: string | null
}

interface Props {
  matchId: string
  homeTeamId: string
  initialEvents: MatchEvent[]
  canDelete?: boolean
}

export function MatchTimeline({ matchId, homeTeamId, initialEvents, canDelete = false }: Props) {
  const [events, setEvents] = useState(initialEvents)

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}/events`)
    if (!res.ok) return
    const data = await res.json()
    setEvents(data.events)
  }, [matchId])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`match:${matchId}:events`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'match_events',
        filter: `match_id=eq.${matchId}`,
      }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [matchId, refresh])

  async function deleteEvent(eventId: string) {
    const res = await fetch(`/api/matches/${matchId}/events/${eventId}`, { method: 'DELETE' })
    if (res.ok) refresh()
  }

  if (events.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No events yet.</p>
  }

  return (
    <div className="space-y-1">
      {events.map((e) => {
        const isHome = e.team.id === homeTeamId
        return (
          <div key={e.id} className={cn('flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors', isHome ? 'flex-row' : 'flex-row-reverse')}>
            <span className="text-lg shrink-0">{EVENT_ICONS[e.type] ?? '•'}</span>
            <div className={cn('flex-1 min-w-0', !isHome && 'text-right')}>
              <p className="text-sm font-medium leading-tight">
                {e.primaryUser?.displayName ?? '—'}
                {e.type === 'SUBSTITUTION' && e.secondaryUser && (
                  <span className="text-muted-foreground text-xs"> ↑ {e.secondaryUser.displayName}</span>
                )}
                {e.type === 'OWN_GOAL' && <span className="text-xs text-muted-foreground"> (OG)</span>}
              </p>
              <p className="text-xs text-muted-foreground">{EVENT_LABELS[e.type] ?? e.type}</p>
            </div>
            <span className="text-xs font-bold text-primary shrink-0 w-8 text-center">{e.minute}'</span>
            {canDelete && (
              <button onClick={() => deleteEvent(e.id)} className="text-xs text-destructive hover:underline shrink-0 ml-1">✕</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
