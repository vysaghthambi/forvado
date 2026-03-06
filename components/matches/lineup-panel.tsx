'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'

interface TeamMember {
  userId: string
  displayName: string
  avatarUrl: string | null
  position: string | null
  jerseyNumber: number | null
}

interface LineupEntry {
  userId: string
  displayName: string
  jerseyNumber: string
  position: string
  isSubstitute: boolean
}

interface Props {
  matchId: string
  teamId: string
  teamName: string
  members: TeamMember[]
  playingMembers: number
  maxSubstitutes: number
  disabled?: boolean
}

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

export function LineupPanel({ matchId, teamId, teamName, members, playingMembers, maxSubstitutes, disabled }: Props) {
  const router = useRouter()
  const [lineup, setLineup] = useState<LineupEntry[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [position, setPosition] = useState('')
  const [isSubstitute, setIsSubstitute] = useState(false)
  const [loading, setLoading] = useState(false)

  const starters = lineup.filter((p) => !p.isSubstitute)
  const bench = lineup.filter((p) => p.isSubstitute)
  const addedIds = new Set(lineup.map((p) => p.userId))
  const availableMembers = members.filter((m) => !addedIds.has(m.userId))

  function addPlayer() {
    if (!selectedUserId || !jerseyNumber || !position) { toast.error('Select player, jersey number, and position'); return }
    if (!isSubstitute && starters.length >= playingMembers) { toast.error(`Max ${playingMembers} starters`); return }
    if (isSubstitute && bench.length >= maxSubstitutes) { toast.error(`Max ${maxSubstitutes} bench players`); return }
    const member = members.find((m) => m.userId === selectedUserId)
    if (!member) return
    setLineup((prev) => [...prev, { userId: selectedUserId, displayName: member.displayName, jerseyNumber, position, isSubstitute }])
    setSelectedUserId(''); setJerseyNumber(''); setPosition('')
  }

  function removePlayer(userId: string) {
    setLineup((prev) => prev.filter((p) => p.userId !== userId))
  }

  async function submitLineup() {
    if (lineup.length === 0) { toast.error('Add at least one player'); return }
    setLoading(true)
    const res = await fetch(`/api/matches/${matchId}/lineup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId,
        players: lineup.map((p) => ({
          userId: p.userId,
          jerseyNumber: parseInt(p.jerseyNumber),
          position: p.position,
          isSubstitute: p.isSubstitute,
        })),
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to submit lineup'); return }
    toast.success(`${teamName} lineup submitted!`)
    router.refresh()
  }

  function PlayerRow({ p, isBench }: { p: LineupEntry; isBench: boolean }) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/30 px-2.5 py-1.5">
        <span className="text-xs text-muted-foreground w-6">#{p.jerseyNumber}</span>
        <span className="text-sm flex-1 truncate">{p.displayName}</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1">{p.position}</Badge>
        {isBench && <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">SUB</Badge>}
        <button onClick={() => removePlayer(p.userId)} className="text-muted-foreground hover:text-destructive ml-1">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{teamName} Lineup</h3>
        <span className="text-xs text-muted-foreground">{starters.length}/{playingMembers} starters · {bench.length}/{maxSubstitutes} bench</span>
      </div>

      {/* Add player form */}
      {!disabled && (
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Player</Label>
            <Select value={selectedUserId} onValueChange={(v) => {
              setSelectedUserId(v)
              const m = members.find((x) => x.userId === v)
              if (m) {
                if (m.jerseyNumber) setJerseyNumber(String(m.jerseyNumber))
                if (m.position) setPosition(m.position)
              }
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {availableMembers.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>{m.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-16">
            <Label className="text-xs">Jersey</Label>
            <Input type="number" min={1} max={99} placeholder="#" value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1 w-20">
            <Label className="text-xs">Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pos" /></SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-16">
            <Label className="text-xs">Role</Label>
            <Select value={isSubstitute ? 'bench' : 'start'} onValueChange={(v) => setIsSubstitute(v === 'bench')}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="bench">Bench</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="icon" className="h-8 w-8 mt-5" onClick={addPlayer} disabled={!selectedUserId || !jerseyNumber || !position}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Player list */}
      {starters.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Starting XI</p>
          {starters.map((p) => <PlayerRow key={p.userId} p={p} isBench={false} />)}
        </div>
      )}
      {bench.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Bench</p>
          {bench.map((p) => <PlayerRow key={p.userId} p={p} isBench />)}
        </div>
      )}

      {lineup.length > 0 && !disabled && (
        <Button className="w-full" size="sm" onClick={submitLineup} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Submitting...</> : 'Submit Lineup'}
        </Button>
      )}
    </div>
  )
}
