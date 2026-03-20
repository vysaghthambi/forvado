'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

interface Props {
  matchId: string
  scheduledAt: string
  venue: string | null
  round: string | null
}

const ROUND_OPTIONS = ['GROUP', 'ROUND OF 32', 'PRE-QUARTER FINAL', 'QUARTER FINAL', 'SEMI-FINAL', 'FINAL']

const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .2s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--muted-clr)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent-clr)'
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border2)'
}

// Convert ISO string to datetime-local input value
function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditFixtureDialog({ matchId, scheduledAt: initialScheduledAt, venue: initialVenue, round: initialRound }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(initialScheduledAt))
  const [venue, setVenue] = useState(initialVenue ?? '')
  const [round, setRound] = useState(initialRound ?? '')

  function handleOpen() {
    setScheduledAt(toDatetimeLocal(initialScheduledAt))
    setVenue(initialVenue ?? '')
    setRound(initialRound ?? '')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!scheduledAt) { toast.error('Date & time is required'); return }

    setLoading(true)
    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduledAt: new Date(scheduledAt).toISOString(),
        venue: venue || null,
        round: round || null,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to update fixture'); return }
    toast.success('Fixture updated!')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Edit fixture"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          color: 'var(--muted-clr)', cursor: 'pointer', flexShrink: 0,
          transition: 'all .15s',
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
        <Pencil size={13} />
      </button>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg1)',
              border: '1px solid var(--border2)',
              borderRadius: 16,
              width: 420, maxWidth: 'calc(100vw - 40px)',
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,.6)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                Edit Fixture
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  color: 'var(--muted-clr)', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s', lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--muted-clr)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <form id="edit-fixture-form" onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 13 }}>
                <Field label="Date & Time">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    style={inputStyle}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </Field>
                <Field label="Venue">
                  <input
                    placeholder="Optional"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    style={inputStyle}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </Field>
                <Field label="Round">
                  <select
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={onFocus} onBlur={onBlur}
                  >
                    <option value="">None</option>
                    {ROUND_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </form>
            </div>

            {/* Footer */}
            <div style={{
              padding: '13px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: 8,
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: 'transparent', border: '1px solid var(--border2)',
                  color: 'var(--text2)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border3)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text2)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-fixture-form"
                disabled={loading}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  background: loading ? 'var(--bg3)' : 'var(--accent-clr)',
                  color: loading ? 'var(--muted-clr)' : '#000',
                  fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'background .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
