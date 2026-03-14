'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'

interface Player {
  id: string
  displayName: string
  jerseyNumber: number
  teamId: string
}

interface Props {
  matchId: string
  currentPlayerId: string | null
  players: Player[]
  homeTeam: { id: string; name: string }
  awayTeam: { id: string; name: string }
}

export function PlayerOfMatch({ matchId, currentPlayerId, players, homeTeam, awayTeam }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentPlayerId ?? '')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    const res = await fetch(`/api/matches/${matchId}/player-of-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerOfMatchId: selected || null }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Player of the match saved')
    router.refresh()
  }

  const home = players.filter((p) => p.teamId === homeTeam.id)
  const away = players.filter((p) => p.teamId === awayTeam.id)

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Player of the Match</h3>
      </div>
      <div className="flex gap-2">
        <Select value={selected || 'none'} onValueChange={(v) => setSelected(v === 'none' ? '' : v)}>
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder="Select player…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {home.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{homeTeam.name}</div>
                {home.map((p) => (
                  <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</SelectItem>
                ))}
              </>
            )}
            {away.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{awayTeam.name}</div>
                {away.map((p) => (
                  <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={save} disabled={loading || selected === (currentPlayerId ?? '')}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </Button>
      </div>
    </div>
  )
}
