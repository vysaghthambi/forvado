'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Player { id: string; displayName: string; jerseyNumber: number; teamId: string }
interface Team { id: string; name: string }

interface Kick {
  id: string
  kickOrder: number
  scored: boolean
  team: Team
  user: { id: string; displayName: string } | null
}

interface Props {
  matchId: string
  status: string
  homeTeam: Team
  awayTeam: Team
  players: Player[]
  initialKicks: Kick[]
  canEdit?: boolean
}

export function PenaltyTracker({ matchId, status, homeTeam, awayTeam, players, initialKicks, canEdit = false }: Props) {
  const router = useRouter()
  const [kicks, setKicks] = useState(initialKicks)
  const [teamId, setTeamId] = useState('')
  const [userId, setUserId] = useState('')
  const [scored, setScored] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const homeKicks = kicks.filter((k) => k.team.id === homeTeam.id)
  const awayKicks = kicks.filter((k) => k.team.id === awayTeam.id)
  const homeGoals = homeKicks.filter((k) => k.scored).length
  const awayGoals = awayKicks.filter((k) => k.scored).length

  const teamPlayers = players.filter((p) => p.teamId === teamId)

  async function addKick() {
    if (!teamId || scored === '') { toast.error('Team and result required'); return }
    const teamKicks = kicks.filter((k) => k.team.id === teamId)
    setLoading(true)
    const res = await fetch(`/api/matches/${matchId}/penalties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId,
        userId: userId || undefined,
        kickOrder: teamKicks.length + 1,
        scored: scored === 'true',
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Penalty kick logged')
    setKicks((prev) => [...prev, data.penalty])
    setTeamId(''); setUserId(''); setScored('')
    router.refresh()
  }

  async function removeKick(kickId: string) {
    const res = await fetch(`/api/matches/${matchId}/penalties/${kickId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to remove kick'); return }
    setKicks((prev) => prev.filter((k) => k.id !== kickId))
    router.refresh()
  }

  function KickList({ team, teamKicks }: { team: Team; teamKicks: Kick[] }) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{team.name}</p>
        {teamKicks.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No kicks yet</p>
        ) : (
          teamKicks.map((k) => (
            <div key={k.id} className="flex items-center gap-2 text-sm">
              <span className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', k.scored ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive')}>
                {k.scored ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <span className="flex-1 truncate">{k.user?.displayName ?? 'Unknown'}</span>
              {canEdit && (
                <button onClick={() => removeKick(k.id)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Penalty Shootout</h3>
        <span className="text-2xl font-black tabular-nums">{homeGoals} – {awayGoals}</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <KickList team={homeTeam} teamKicks={homeKicks} />
        <KickList team={awayTeam} teamKicks={awayKicks} />
      </div>

      {canEdit && status === 'PENALTY_SHOOTOUT' && (
        <div className="border-t border-border/30 pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Log Kick</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Team</Label>
              <Select value={teamId} onValueChange={(v) => { setTeamId(v); setUserId('') }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={homeTeam.id}>{homeTeam.name}</SelectItem>
                  <SelectItem value={awayTeam.id}>{awayTeam.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Player</Label>
              <Select value={userId || 'none'} onValueChange={(v) => setUserId(v === 'none' ? '' : v)} disabled={!teamId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unknown —</SelectItem>
                  {teamPlayers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Result</Label>
              <Select value={scored} onValueChange={setScored}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Result" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ Scored</SelectItem>
                  <SelectItem value="false">❌ Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={addKick} disabled={loading || !teamId || scored === ''}>
            {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Logging...</> : 'Log Kick'}
          </Button>
        </div>
      )}
    </div>
  )
}
