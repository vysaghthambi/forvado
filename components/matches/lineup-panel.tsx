'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, GripVertical } from 'lucide-react'

interface TeamMember {
  userId: string
  displayName: string
  avatarUrl: string | null
  position: string | null
  jerseyNumber: number | null
}

interface LineupPlayer {
  userId: string
  displayName: string
  jerseyNumber: number
  position: string
  section: 'playing' | 'bench' | 'none'
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
const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 }

function initPlayers(
  members: TeamMember[],
  playingMembers: number,
  maxSubstitutes: number,
): LineupPlayer[] {
  const sorted = [...members].sort((a, b) => {
    const pa = POS_ORDER[a.position ?? 'MID'] ?? 2
    const pb = POS_ORDER[b.position ?? 'MID'] ?? 2
    if (pa !== pb) return pa - pb
    return a.displayName.localeCompare(b.displayName)
  })
  return sorted.map((m, i) => ({
    userId:      m.userId,
    displayName: m.displayName,
    jerseyNumber: m.jerseyNumber ?? i + 1,
    position:    m.position ?? 'MID',
    section:
      i < playingMembers                          ? 'playing'
      : i < playingMembers + maxSubstitutes       ? 'bench'
      : 'none',
  }))
}

export function LineupPanel({
  matchId, teamId, teamName, members, playingMembers, maxSubstitutes, disabled,
}: Props) {
  const router  = useRouter()
  const [players, setPlayers] = useState<LineupPlayer[]>(() =>
    initPlayers(members, playingMembers, maxSubstitutes)
  )
  const [dragOver, setDragOver] = useState<'playing' | 'bench' | 'none' | null>(null)
  const [loading, setLoading]   = useState(false)
  const dragRef = useRef<{ userId: string; fromSection: 'playing' | 'bench' | 'none' } | null>(null)

  const playing    = players.filter((p) => p.section === 'playing')
  const bench      = players.filter((p) => p.section === 'bench')
  const notPlaying = players.filter((p) => p.section === 'none')

  function updatePlayer(userId: string, field: 'jerseyNumber' | 'position', value: string) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.userId === userId
          ? { ...p, [field]: field === 'jerseyNumber' ? Number(value) : value }
          : p
      )
    )
  }

  function handleDrop(toSection: 'playing' | 'bench' | 'none') {
    setDragOver(null)
    if (!dragRef.current) return
    const { userId, fromSection } = dragRef.current
    dragRef.current = null
    if (fromSection === toSection) return

    if (toSection === 'playing') {
      const currentCount = players.filter((p) => p.section === 'playing').length
      const leavingPlaying = fromSection === 'playing'
      if (!leavingPlaying && currentCount >= playingMembers) {
        toast.warning(`Playing section is full (max ${playingMembers})`)
        return
      }
    }

    setPlayers((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, section: toSection } : p))
    )
  }

  async function submitLineup() {
    if (playing.length !== playingMembers) {
      toast.error(`Need exactly ${playingMembers} starters (currently ${playing.length})`)
      return
    }
    setLoading(true)
    const submitting = players.filter((p) => p.section !== 'none')
    const res = await fetch(`/api/matches/${matchId}/lineup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId,
        players: submitting.map((p) => ({
          userId:       p.userId,
          jerseyNumber: p.jerseyNumber,
          position:     p.position,
          isSubstitute: p.section === 'bench',
        })),
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to submit lineup'); return }
    toast.success(`${teamName} lineup submitted!`)
    router.refresh()
  }

  function Section({
    title,
    section,
    items,
    dimCount,
  }: {
    title: string
    section: 'playing' | 'bench' | 'none'
    items: LineupPlayer[]
    dimCount?: boolean
  }) {
    const isOver = dragOver === section
    const countLabel =
      section === 'playing' ? `${items.length}/${playingMembers}`
      : section === 'bench'  ? `${items.length}/${maxSubstitutes}`
      : String(items.length)
    const headerCls =
      section === 'playing' && items.length < playingMembers
        ? 'text-amber-500'
        : 'text-muted-foreground'

    return (
      <div
        className={`rounded-lg border p-3 space-y-2 transition-colors ${isOver ? 'border-primary bg-primary/5' : 'border-border/50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(section) }}
        onDragLeave={() => setDragOver(null)}
        onDrop={() => handleDrop(section)}
      >
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium uppercase tracking-wider ${headerCls}`}>{title}</p>
          <span className={`text-xs ${dimCount ? 'text-muted-foreground' : headerCls}`}>{countLabel}</span>
        </div>

        {items.map((p) => (
          <div
            key={p.userId}
            draggable={!disabled}
            onDragStart={() => { dragRef.current = { userId: p.userId, fromSection: section } }}
            className="flex items-center gap-2 rounded-md border border-border/30 bg-background px-2 py-1.5 cursor-grab active:cursor-grabbing select-none"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

            {disabled ? (
              <span className="text-xs text-muted-foreground w-14">#{p.jerseyNumber}</span>
            ) : (
              <Input
                type="number"
                min={1}
                max={99}
                value={p.jerseyNumber}
                onChange={(e) => updatePlayer(p.userId, 'jerseyNumber', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-14 text-xs px-1"
              />
            )}

            <span className="text-sm flex-1 truncate">{p.displayName}</span>

            {disabled ? (
              <span className="text-xs text-muted-foreground w-[72px]">{p.position}</span>
            ) : (
              <Select
                value={p.position}
                onValueChange={(v) => updatePlayer(p.userId, 'position', v)}
              >
                <SelectTrigger
                  className="h-6 w-[72px] text-xs px-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2 italic">
            Drag players here
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{teamName} Lineup</h3>
        <span className="text-xs text-muted-foreground">{members.length} members</span>
      </div>

      <Section title="Playing"      section="playing" items={playing} />
      <Section title="Substitutes"  section="bench"   items={bench}  dimCount />
      <Section title="Not Playing"  section="none"    items={notPlaying} dimCount />

      {!disabled && (
        <Button
          className="w-full"
          size="sm"
          onClick={submitLineup}
          disabled={playing.length !== playingMembers || loading}
        >
          {loading
            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Submitting...</>
            : `Submit Lineup (${playing.length}/${playingMembers} starters)`}
        </Button>
      )}
    </div>
  )
}
