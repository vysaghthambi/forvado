'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputStyle, labelStyle } from '@/lib/styles'

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

function onFocus(e: React.FocusEvent<HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent-clr)'
}
function onBlur(e: React.FocusEvent<HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border2)'
}

export function PenaltyTracker({ matchId, status, homeTeam, awayTeam, players, initialKicks, canEdit = false }: Props) {
  const router = useRouter()
  const [kicks, setKicks] = useState(initialKicks)
  const [teamId, setTeamId] = useState('')
  const [userId, setUserId] = useState('')
  const [scored, setScored] = useState('')
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-clr)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
          {team.name}
        </p>
        {teamKicks.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted-clr)', fontStyle: 'italic' }}>No kicks yet</p>
        ) : (
          teamKicks.map((k) => (
            <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <div className={cn(
                'h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                k.scored ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'
              )}>
                {k.scored ? <Check size={11} /> : <X size={11} />}
              </div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                {k.user?.displayName ?? 'Unknown'}
              </span>
              {canEdit && (
                <button
                  onClick={() => removeKick(k.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-clr)', padding: 0, fontSize: 12 }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--live)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--muted-clr)'}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--text2)' }}>
          Penalty Shootout
        </span>
        <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '2px' }}>
          {homeGoals} – {awayGoals}
        </span>
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Kick lists */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <KickList team={homeTeam} teamKicks={homeKicks} />
          <KickList team={awayTeam} teamKicks={awayKicks} />
        </div>

        {/* Log kick form */}
        {canEdit && status === 'PENALTY_SHOOTOUT' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-clr)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Log Kick
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Team">
                <select
                  value={teamId}
                  onChange={(e) => { setTeamId(e.target.value); setUserId('') }}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={onFocus} onBlur={onBlur}
                >
                  <option value="">Team…</option>
                  <option value={homeTeam.id}>{homeTeam.name}</option>
                  <option value={awayTeam.id}>{awayTeam.name}</option>
                </select>
              </Field>
              <Field label="Player">
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={!teamId}
                  style={{ ...inputStyle, cursor: !teamId ? 'not-allowed' : 'pointer', opacity: !teamId ? 0.5 : 1 }}
                  onFocus={onFocus} onBlur={onBlur}
                >
                  <option value="">Unknown</option>
                  {teamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</option>
                  ))}
                </select>
              </Field>
              <Field label="Result">
                <select
                  value={scored}
                  onChange={(e) => setScored(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={onFocus} onBlur={onBlur}
                >
                  <option value="">Result…</option>
                  <option value="true">✅ Scored</option>
                  <option value="false">❌ Missed</option>
                </select>
              </Field>
            </div>
            <button
              type="button"
              onClick={addKick}
              disabled={loading || !teamId || scored === ''}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '9px 0', borderRadius: 8,
                background: (loading || !teamId || scored === '') ? 'var(--bg3)' : 'var(--accent-clr)',
                color: (loading || !teamId || scored === '') ? 'var(--muted-clr)' : '#000',
                fontSize: 13, fontWeight: 600, border: 'none',
                cursor: (loading || !teamId || scored === '') ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Logging…</> : 'Log Kick'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
