'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'

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

const EVENT_TYPES = [
  { value: 'GOAL',             label: '⚽ Goal' },
  { value: 'OWN_GOAL',        label: '⚽ Own Goal' },
  { value: 'EXTRA_TIME_GOAL', label: '⚽ ET Goal' },
  { value: 'YELLOW_CARD',     label: '🟨 Yellow Card' },
  { value: 'RED_CARD',        label: '🟥 Red Card' },
  { value: 'SECOND_YELLOW',   label: '🟨🟥 2nd Yellow' },
  { value: 'SUBSTITUTION',    label: '🔄 Substitution' },
]

function getPhase(minute: number): string {
  if (minute <= 45) return 'First Half'
  if (minute <= 90) return 'Second Half'
  return 'Extra Time'
}

function PhaseDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2 my-1">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  )
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

interface Player {
  id: string
  displayName: string
  jerseyNumber: number
  teamId: string
  isSubstitute?: boolean
  position?: string
}

interface Props {
  matchId: string
  homeTeamId: string
  initialEvents: MatchEvent[]
  canDelete?: boolean
  canEdit?: boolean
  homeTeam?: { id: string; name: string }
  awayTeam?: { id: string; name: string }
  players?: Player[]
}

export function MatchTimeline({
  matchId, homeTeamId, initialEvents,
  canDelete = false, canEdit = false,
  homeTeam, awayTeam, players = [],
}: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [deleteConfirm, setDeleteConfirm] = useState<MatchEvent | null>(null)
  const [editEvent, setEditEvent]         = useState<MatchEvent | null>(null)
  const [editType, setEditType]           = useState('')
  const [editMinute, setEditMinute]       = useState('')
  const [editTeamId, setEditTeamId]       = useState('')
  const [editPrimary, setEditPrimary]     = useState('')
  const [editSecondary, setEditSecondary] = useState('')
  const [editLoading, setEditLoading]     = useState(false)

  useEffect(() => { setEvents(initialEvents) }, [initialEvents])

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

  async function confirmDelete() {
    if (!deleteConfirm) return
    const res = await fetch(`/api/matches/${matchId}/events/${deleteConfirm.id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    if (res.ok) { refresh(); toast.success('Event deleted') }
    else { const d = await res.json(); toast.error(d.error ?? 'Delete failed') }
  }

  function openEdit(e: MatchEvent) {
    setEditEvent(e)
    setEditType(e.type)
    setEditMinute(String(e.minute))
    setEditTeamId(e.team.id)
    setEditPrimary(e.primaryUser?.id ?? '')
    setEditSecondary(e.secondaryUser?.id ?? '')
  }

  async function submitEdit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!editEvent) return
    setEditLoading(true)
    const res = await fetch(`/api/matches/${matchId}/events/${editEvent.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:            editType,
        minute:          parseInt(editMinute),
        teamId:          editTeamId,
        primaryUserId:   editPrimary || null,
        secondaryUserId: editSecondary || null,
      }),
    })
    const data = await res.json()
    setEditLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to update event'); return }
    toast.success('Event updated')
    setEditEvent(null)
    refresh()
  }

  const needsSecondary = editType === 'GOAL' || editType === 'EXTRA_TIME_GOAL' || editType === 'SUBSTITUTION'
  const editTeamPlayers = players.filter((p) => p.teamId === editTeamId)

  if (events.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No events yet.</p>
  }

  // Render events with phase dividers
  let lastPhase = ''
  const rows: React.ReactNode[] = []

  events.forEach((e) => {
    const phase = getPhase(e.minute)
    if (phase !== lastPhase) {
      rows.push(<PhaseDivider key={`divider-${phase}-${e.id}`} label={phase} />)
      lastPhase = phase
    }

    const isHome = e.team.id === homeTeamId
    rows.push(
      <div
        key={e.id}
        className={cn(
          'group flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors',
          isHome ? 'flex-row' : 'flex-row-reverse'
        )}
      >
        <span className="text-lg shrink-0">{EVENT_ICONS[e.type] ?? '•'}</span>
        <div className={cn('flex-1 min-w-0', !isHome && 'text-right')}>
          <p className="text-sm font-semibold leading-tight">
            {e.primaryUser?.displayName ?? '—'}
            {e.type === 'OWN_GOAL' && (
              <span className="text-xs text-red-400 font-normal"> (OG)</span>
            )}
          </p>
          {e.type === 'SUBSTITUTION' && e.secondaryUser ? (
            <p className="text-xs text-muted-foreground">
              ↑ {e.secondaryUser.displayName} &nbsp;•&nbsp; {e.team.name}
            </p>
          ) : (e.type === 'GOAL' || e.type === 'EXTRA_TIME_GOAL') && e.secondaryUser ? (
            <p className="text-xs text-muted-foreground">
              assist: {e.secondaryUser.displayName} &nbsp;•&nbsp; {e.team.name}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{e.team.name}</p>
          )}
        </div>
        <span className="text-xs font-bold text-primary shrink-0 w-8 text-center">{e.minute}&apos;</span>
        {(canEdit || canDelete) && (
          <div
            className={cn(
              'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
              !isHome && 'flex-row-reverse'
            )}
          >
            {canEdit && (
              <button
                onClick={() => openEdit(e)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
                title="Edit event"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteConfirm(e)}
                className="p-1 rounded text-muted-foreground hover:text-destructive"
                title="Delete event"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  })

  return (
    <>
      <div className="space-y-0.5">{rows}</div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete{' '}
            <span className="font-medium text-foreground">
              {EVENT_LABELS[deleteConfirm?.type ?? ''] ?? deleteConfirm?.type}
            </span>{' '}
            at{' '}
            <span className="font-medium text-foreground">{deleteConfirm?.minute}&apos;</span>
            {deleteConfirm?.primaryUser && (
              <> by <span className="font-medium text-foreground">{deleteConfirm.primaryUser.displayName}</span></>
            )}
            ? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit event dialog */}
      <Dialog open={!!editEvent} onOpenChange={(o) => { if (!o) setEditEvent(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-3 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Minute</Label>
                <Input
                  type="number" min={0} max={200}
                  value={editMinute} onChange={(e) => setEditMinute(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {homeTeam && awayTeam && (
              <div className="space-y-1.5">
                <Label className="text-xs">Team</Label>
                <Select value={editTeamId} onValueChange={(v) => { setEditTeamId(v); setEditPrimary(''); setEditSecondary('') }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={homeTeam.id}>{homeTeam.name}</SelectItem>
                    <SelectItem value={awayTeam.id}>{awayTeam.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {editTeamId && players.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {editType === 'SUBSTITUTION' ? 'Player Out' : editType === 'GOAL' || editType === 'OWN_GOAL' || editType === 'EXTRA_TIME_GOAL' ? 'Scorer' : 'Player'}
                </Label>
                <Select value={editPrimary || 'none'} onValueChange={(v) => setEditPrimary(v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {editTeamPlayers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editTeamId && players.length > 0 && needsSecondary && (
              <div className="space-y-1.5">
                <Label className="text-xs">{editType === 'SUBSTITUTION' ? 'Player In' : 'Assist (optional)'}</Label>
                <Select value={editSecondary || 'none'} onValueChange={(v) => setEditSecondary(v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {editTeamPlayers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditEvent(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={editLoading}>
                {editLoading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
