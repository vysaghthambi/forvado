'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { inputStyle, labelStyle } from '@/lib/styles'

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

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent-clr)'
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border2)'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
}

const modalStyle: React.CSSProperties = {
  background: 'var(--bg1)',
  border: '1px solid var(--border2)',
  borderRadius: 16,
  maxWidth: 'calc(100vw - 40px)',
  maxHeight: '90vh',
  display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,.6)',
  overflow: 'hidden',
}

const modalHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexShrink: 0,
}

const modalTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
  fontSize: 17, fontWeight: 700, letterSpacing: '.2px', color: 'var(--text)',
}

const modalFootStyle: React.CSSProperties = {
  padding: '13px 20px',
  borderTop: '1px solid var(--border)',
  display: 'flex', justifyContent: 'flex-end', gap: 8,
  flexShrink: 0,
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      style={{
        width: 26, height: 26, borderRadius: 6,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        color: 'var(--muted-clr)', fontSize: 14, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s', lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.color = 'var(--text)'
        el.style.borderColor = 'var(--border2)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.color = 'var(--muted-clr)'
        el.style.borderColor = 'var(--border)'
      }}
    >
      ✕
    </button>
  )
}

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
  const [events, setEvents]           = useState(initialEvents)
  const [deleteConfirm, setDeleteConfirm] = useState<MatchEvent | null>(null)
  const [editEvent, setEditEvent]     = useState<MatchEvent | null>(null)
  const [editType, setEditType]       = useState('')
  const [editMinute, setEditMinute]   = useState('')
  const [editTeamId, setEditTeamId]   = useState('')
  const [editPrimary, setEditPrimary] = useState('')
  const [editSecondary, setEditSecondary] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
    setDeleteLoading(true)
    const res = await fetch(`/api/matches/${matchId}/events/${deleteConfirm.id}`, { method: 'DELETE' })
    setDeleteLoading(false)
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

      {/* ── Delete confirmation modal ─────────────────────────────── */}
      {deleteConfirm && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div style={{ ...modalStyle, width: 400 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={modalHeaderStyle}>
              <div style={modalTitleStyle}>Delete Event</div>
              <CloseButton onClose={() => setDeleteConfirm(null)} />
            </div>

            {/* Body */}
            <div style={{ padding: '20px', flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Delete{' '}
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {EVENT_LABELS[deleteConfirm.type] ?? deleteConfirm.type}
                </span>
                {' '}at{' '}
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{deleteConfirm.minute}&apos;</span>
                {deleteConfirm.primaryUser && (
                  <> by <span style={{ fontWeight: 600, color: 'var(--text)' }}>{deleteConfirm.primaryUser.displayName}</span></>
                )}
                {'? '}
                <span style={{ color: 'var(--muted-clr)' }}>This cannot be undone.</span>
              </p>
            </div>

            {/* Footer */}
            <div style={modalFootStyle}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: 'transparent', border: '1px solid var(--border2)',
                  color: 'var(--text2)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  background: deleteLoading ? 'var(--bg3)' : 'var(--live)',
                  color: deleteLoading ? 'var(--muted-clr)' : '#fff',
                  fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {deleteLoading ? 'Deleting…' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit event modal ──────────────────────────────────────── */}
      {editEvent && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setEditEvent(null) }}>
          <div style={{ ...modalStyle, width: 460 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={modalHeaderStyle}>
              <div style={modalTitleStyle}>Edit Event</div>
              <CloseButton onClose={() => setEditEvent(null)} />
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <form
                id="edit-event-form"
                onSubmit={submitEdit}
                style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 13 }}
              >
                {/* Type + Minute */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Event Type">
                    <select
                      value={editType}
                      onChange={(e) => { setEditType(e.target.value); setEditPrimary(''); setEditSecondary('') }}
                      style={inputStyle}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Minute">
                    <input
                      type="number" min={0} max={200}
                      value={editMinute}
                      onChange={(e) => setEditMinute(e.target.value)}
                      style={inputStyle}
                      onFocus={onFocus} onBlur={onBlur}
                    />
                  </Field>
                </div>

                {/* Team */}
                {homeTeam && awayTeam && (
                  <Field label="Team">
                    <select
                      value={editTeamId}
                      onChange={(e) => { setEditTeamId(e.target.value); setEditPrimary(''); setEditSecondary('') }}
                      style={inputStyle}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="">Select team…</option>
                      <option value={homeTeam.id}>{homeTeam.name}</option>
                      <option value={awayTeam.id}>{awayTeam.name}</option>
                    </select>
                  </Field>
                )}

                {/* Primary player */}
                {editTeamId && players.length > 0 && (
                  <Field label={
                    editType === 'SUBSTITUTION' ? 'Player Out'
                    : editType === 'GOAL' || editType === 'OWN_GOAL' || editType === 'EXTRA_TIME_GOAL' ? 'Scorer'
                    : 'Player'
                  }>
                    <select
                      value={editPrimary || ''}
                      onChange={(e) => setEditPrimary(e.target.value)}
                      style={inputStyle}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="">— None —</option>
                      {editTeamPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {/* Secondary player */}
                {editTeamId && players.length > 0 && needsSecondary && (
                  <Field label={editType === 'SUBSTITUTION' ? 'Player In' : 'Assist (optional)'}>
                    <select
                      value={editSecondary || ''}
                      onChange={(e) => setEditSecondary(e.target.value)}
                      style={inputStyle}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="">— None —</option>
                      {editTeamPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </form>
            </div>

            {/* Footer */}
            <div style={modalFootStyle}>
              <button
                type="button"
                onClick={() => setEditEvent(null)}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: 'transparent', border: '1px solid var(--border2)',
                  color: 'var(--text2)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'var(--bg3)'
                  el.style.borderColor = 'var(--border3)'
                  el.style.color = 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.borderColor = 'var(--border2)'
                  el.style.color = 'var(--text2)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-event-form"
                disabled={editLoading}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  background: editLoading ? 'var(--bg3)' : 'var(--accent-clr)',
                  color: editLoading ? 'var(--muted-clr)' : '#000',
                  fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: editLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'background .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
