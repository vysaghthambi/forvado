'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { computeElapsedMinutes } from '@/hooks/use-match-timer'

interface Player {
  id: string
  displayName: string
  jerseyNumber: number
  isSubstitute: boolean
  position: string
  teamId: string
}

interface Team { id: string; name: string }

interface MatchTimestamps {
  matchTime: number
  firstHalfStartedAt: string | null
  secondHalfStartedAt: string | null
  etFirstHalfStartedAt: string | null
  etSecondHalfStartedAt: string | null
}

interface Props {
  matchId: string
  status: string
  homeTeam: Team
  awayTeam: Team
  players: Player[]
  timestamps: MatchTimestamps
}

const EVENT_TYPES = [
  { value: 'GOAL', label: '⚽ Goal' },
  { value: 'OWN_GOAL', label: '⚽ Own Goal' },
  { value: 'EXTRA_TIME_GOAL', label: '⚽ ET Goal' },
  { value: 'YELLOW_CARD', label: '🟨 Yellow Card' },
  { value: 'RED_CARD', label: '🟥 Red Card' },
  { value: 'SECOND_YELLOW', label: '🟨🟥 2nd Yellow' },
  { value: 'SUBSTITUTION', label: '🔄 Substitution' },
]

const ACTIVE_PHASES = ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_SECOND_HALF']

export function EventLogger({ matchId, status, homeTeam, awayTeam, players, timestamps }: Props) {
  const router = useRouter()
  const [type, setType] = useState('')
  const [teamId, setTeamId] = useState('')
  const [primaryUserId, setPrimaryUserId] = useState('')
  const [secondaryUserId, setSecondaryUserId] = useState('')
  const [minute, setMinute] = useState(() =>
    String(computeElapsedMinutes({ status, ...timestamps }))
  )
  const [loading, setLoading] = useState(false)

  const isActive = ACTIVE_PHASES.includes(status)
  const teamPlayers = players.filter((p) => p.teamId === teamId)
  const needsSecondary = type === 'GOAL' || type === 'EXTRA_TIME_GOAL' || type === 'SUBSTITUTION'
  const secondaryLabel = type === 'SUBSTITUTION' ? 'Player In' : 'Assist (optional)'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !teamId || !minute) { toast.error('Type, team, and minute are required'); return }

    setLoading(true)
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        teamId,
        minute: parseInt(minute),
        primaryUserId: primaryUserId || undefined,
        secondaryUserId: secondaryUserId || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to log event'); return }
    toast.success('Event logged')
    setType(''); setTeamId(''); setPrimaryUserId(''); setSecondaryUserId('')
    setMinute(String(computeElapsedMinutes({ status, ...timestamps })))
    router.refresh()
  }

  if (!isActive) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">Events can only be logged during active phases.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Log Event</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Type *</Label>
            <Select value={type} onValueChange={(v) => { setType(v); setPrimaryUserId(''); setSecondaryUserId('') }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Event type" /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Minute *</Label>
            <Input type="number" min={0} max={200} value={minute} onChange={(e) => setMinute(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Team *</Label>
          <Select value={teamId} onValueChange={(v) => { setTeamId(v); setPrimaryUserId(''); setSecondaryUserId('') }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select team" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={homeTeam.id}>{homeTeam.name}</SelectItem>
              <SelectItem value={awayTeam.id}>{awayTeam.name}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {teamId && (
          <div className="space-y-1">
            <Label className="text-xs">
              {type === 'SUBSTITUTION' ? 'Player Out' : type === 'GOAL' || type === 'OWN_GOAL' || type === 'EXTRA_TIME_GOAL' ? 'Scorer' : 'Player'}
            </Label>
            <Select value={primaryUserId || 'none'} onValueChange={(v) => setPrimaryUserId(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select player (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {teamPlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName} ({p.position})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {teamId && needsSecondary && (
          <div className="space-y-1">
            <Label className="text-xs">{secondaryLabel}</Label>
            <Select value={secondaryUserId || 'none'} onValueChange={(v) => setSecondaryUserId(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select player (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {teamPlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName} ({p.position})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button type="submit" size="sm" className="w-full gap-1.5" disabled={loading}>
          {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Logging...</> : <><Plus className="h-3.5 w-3.5" />Log Event</>}
        </Button>
      </form>
    </div>
  )
}
