'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  { value: 'GOAL',          label: '⚽ Goal' },
  { value: 'OWN_GOAL',      label: '⚽ Own Goal' },
  { value: 'YELLOW_CARD',   label: '🟨 Yellow Card' },
  { value: 'RED_CARD',      label: '🟥 Red Card' },
  { value: 'SECOND_YELLOW', label: '🟨🟥 2nd Yellow' },
  { value: 'SUBSTITUTION',  label: '🔄 Substitution' },
]

const ACTIVE_PHASES = ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_SECOND_HALF']

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
  appearance: 'auto' as const,
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--muted-clr)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={labelStyle}>
        {label}{required && <span style={{ color: 'var(--live)', marginLeft: 3 }}>*</span>}
      </div>
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
  const isPenalty = status === 'PENALTY_SHOOTOUT'
  const teamPlayers = players.filter((p) => p.teamId === teamId)
  const needsSecondary = type === 'GOAL' || type === 'SUBSTITUTION'
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

  // During penalty shootout, penalty tracker handles input — hide this section entirely
  if (isPenalty) return null

  if (!isActive) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '16px 20px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: 'var(--muted-clr)' }}>Events can only be logged during active phases.</p>
      </div>
    )
  }

  const playerLabel = type === 'SUBSTITUTION' ? 'Player Out' : (type === 'GOAL' || type === 'OWN_GOAL') ? 'Scorer' : 'Player'

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text2)' }}>
          Log Event
        </span>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Event Type" required>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPrimaryUserId(''); setSecondaryUserId('') }}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={onFocus} onBlur={onBlur}
            >
              <option value="">Select type…</option>
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Minute" required>
            <input
              type="number" min={0} max={200}
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              style={inputStyle}
              onFocus={onFocus} onBlur={onBlur}
            />
          </Field>
        </div>

        <Field label="Team" required>
          <select
            value={teamId}
            onChange={(e) => { setTeamId(e.target.value); setPrimaryUserId(''); setSecondaryUserId('') }}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={onFocus} onBlur={onBlur}
          >
            <option value="">Select team…</option>
            <option value={homeTeam.id}>{homeTeam.name}</option>
            <option value={awayTeam.id}>{awayTeam.name}</option>
          </select>
        </Field>

        {teamId && (
          <Field label={playerLabel}>
            <select
              value={primaryUserId}
              onChange={(e) => setPrimaryUserId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={onFocus} onBlur={onBlur}
            >
              <option value="">— None —</option>
              {teamPlayers.map((p) => (
                <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName} ({p.position})</option>
              ))}
            </select>
          </Field>
        )}

        {teamId && needsSecondary && (
          <Field label={secondaryLabel}>
            <select
              value={secondaryUserId}
              onChange={(e) => setSecondaryUserId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={onFocus} onBlur={onBlur}
            >
              <option value="">— None —</option>
              {teamPlayers.map((p) => (
                <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName} ({p.position})</option>
              ))}
            </select>
          </Field>
        )}

        <button
          type="submit"
          disabled={loading || !type || !teamId || !minute}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '9px 0', borderRadius: 8,
            background: (loading || !type || !teamId || !minute) ? 'var(--bg3)' : 'var(--accent-clr)',
            color: (loading || !type || !teamId || !minute) ? 'var(--muted-clr)' : '#000',
            fontSize: 13, fontWeight: 600, border: 'none',
            cursor: (loading || !type || !teamId || !minute) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Logging…</> : <><Plus size={14} /> Log Event</>}
        </button>
      </form>
    </div>
  )
}
