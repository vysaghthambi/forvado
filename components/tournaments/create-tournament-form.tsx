'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  format: z.enum(['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT'], { error: 'Select a format' }),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  venue: z.string().optional(),
  maxTeams: z.string().min(1, 'Max teams required'),
  matchTime: z.string().optional(),
  playingMembers: z.string().optional(),
  maxSubstitutes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Team {
  id: string
  name: string
  badgeUrl: string | null
  homeColour?: string | null
}

// ── Shared input styles ────────────────────────────────────────────────────────

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
  transition: 'border-color .15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--muted-clr)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

function FormGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</div>
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <span style={{ fontSize: 11, color: 'var(--live)', marginTop: 2 }}>{msg}</span>
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CreateTournamentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [step1Data, setStep1Data] = useState<FormValues | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { matchTime: '90', playingMembers: '11', maxSubstitutes: '5' },
  })

  const maxTeams = parseInt(watch('maxTeams') || '0')

  useEffect(() => {
    if (step === 2) {
      setTeamsLoading(true)
      fetch('/api/teams?limit=50')
        .then((r) => r.json())
        .then((d) => setTeams(d.teams ?? []))
        .finally(() => setTeamsLoading(false))
    }
  }, [step])

  function onStep1Submit(values: FormValues) {
    setStep1Data(values)
    setStep(2)
  }

  async function onFinalSubmit() {
    if (!step1Data) return
    if (selectedTeams.length !== maxTeams) {
      toast.error(`Select exactly ${maxTeams} teams`)
      return
    }
    setLoading(true)
    const res = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...step1Data, teamIds: selectedTeams }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create tournament')
      return
    }
    toast.success('Tournament created!')
    router.push(`/tournaments/${data.tournament.id}`)
  }

  function toggleTeam(teamId: string) {
    setSelectedTeams((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId)
      if (prev.length >= maxTeams) return prev
      return [...prev, teamId]
    })
  }

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Stepper ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <StepIndicator num={1} label="Configuration" state={step === 1 ? 'active' : 'done'} />
        <div style={{
          flex: 1, height: 1,
          background: step > 1 ? 'var(--green)' : 'var(--border2)',
          margin: '0 10px', transition: 'background .3s',
        }} />
        <StepIndicator num={2} label="Team Selection" state={step === 2 ? 'active' : step > 2 ? 'done' : 'idle'} />
      </div>

      {/* ── Step 1: Configuration ── */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onStep1Submit)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
                textTransform: 'uppercase', color: 'var(--text2)',
              }}>
                Tournament Configuration
              </span>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Row 1: Name + Format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="sm:grid-cols-2 grid-cols-1">
                <FormGroup>
                  <label style={labelStyle}>Tournament Title *</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Spring Cup 2025"
                    {...register('name')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = errors.name ? 'var(--live)' : 'var(--border2)')}
                  />
                  <ErrorMsg msg={errors.name?.message} />
                </FormGroup>

                <FormGroup>
                  <label style={labelStyle}>Format *</label>
                  <select
                    style={inputStyle}
                    defaultValue=""
                    onChange={(e) => setValue('format', e.target.value as 'LEAGUE' | 'KNOCKOUT' | 'GROUP_KNOCKOUT')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = errors.format ? 'var(--live)' : 'var(--border2)')}
                  >
                    <option value="" disabled>Select format</option>
                    <option value="LEAGUE">League (Round Robin)</option>
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="GROUP_KNOCKOUT">Group + Knockout</option>
                  </select>
                  <ErrorMsg msg={errors.format?.message} />
                </FormGroup>
              </div>

              {/* Description */}
              <FormGroup>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  placeholder="Brief description of this tournament…"
                  rows={3}
                  {...register('description')}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
                />
              </FormGroup>

              {/* Row 2: Start Date + End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormGroup>
                  <label style={labelStyle}>Start Date *</label>
                  <input
                    type="date"
                    style={inputStyle}
                    {...register('startDate')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = errors.startDate ? 'var(--live)' : 'var(--border2)')}
                  />
                  <ErrorMsg msg={errors.startDate?.message} />
                </FormGroup>

                <FormGroup>
                  <label style={labelStyle}>End Date *</label>
                  <input
                    type="date"
                    style={inputStyle}
                    {...register('endDate')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = errors.endDate ? 'var(--live)' : 'var(--border2)')}
                  />
                  <ErrorMsg msg={errors.endDate?.message} />
                </FormGroup>
              </div>

              {/* Row 3: Max Teams + Venue */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormGroup>
                  <label style={labelStyle}>Max Teams *</label>
                  <input
                    type="number"
                    min={2}
                    max={128}
                    style={inputStyle}
                    placeholder="e.g. 8, 12, 16"
                    {...register('maxTeams')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = errors.maxTeams ? 'var(--live)' : 'var(--border2)')}
                  />
                  <span style={{ fontSize: 11, color: 'var(--muted-clr)', marginTop: 3 }}>
                    Must be a power of 2 for knockout formats.
                  </span>
                  <ErrorMsg msg={errors.maxTeams?.message} />
                </FormGroup>

                <FormGroup>
                  <label style={labelStyle}>Venue / Ground</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. City Stadium"
                    {...register('venue')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
                  />
                </FormGroup>
              </div>

              {/* Divider + Match Rules */}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                fontSize: 13, fontWeight: 700, letterSpacing: '.4px',
                color: 'var(--text2)', textTransform: 'uppercase', marginBottom: 2,
              }}>
                Match Rules
              </div>

              {/* Row 4: Match Duration + Playing Members + Max Substitutes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <FormGroup>
                  <label style={labelStyle}>Match Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    style={inputStyle}
                    {...register('matchTime')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
                  />
                </FormGroup>

                <FormGroup>
                  <label style={labelStyle}>Playing Members</label>
                  <input
                    type="number"
                    min={1}
                    max={11}
                    style={inputStyle}
                    {...register('playingMembers')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
                  />
                  <span style={{ fontSize: 11, color: 'var(--muted-clr)', marginTop: 3 }}>Players on pitch per team.</span>
                </FormGroup>

                <FormGroup>
                  <label style={labelStyle}>Max Substitutes</label>
                  <input
                    type="number"
                    min={0}
                    max={11}
                    style={inputStyle}
                    {...register('maxSubstitutes')}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
                  />
                </FormGroup>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <Link
                  href="/tournaments"
                  className="no-underline"
                  style={{
                    padding: '8px 18px', borderRadius: 8,
                    border: '1px solid var(--border2)', background: 'transparent',
                    fontSize: 13, fontWeight: 500, color: 'var(--text2)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px', borderRadius: 9,
                    background: 'var(--accent-clr)', color: '#000',
                    fontSize: 13, fontWeight: 600, border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Next: Select Teams →
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Step 2: Team Selection ── */}
      {step === 2 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
              textTransform: 'uppercase', color: 'var(--text2)',
            }}>
              Select Teams
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted-clr)' }}>
              {selectedTeams.length} / {maxTeams} teams selected
            </span>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <svg
                viewBox="0 0 24 24"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, stroke: 'var(--muted-clr)', fill: 'none', strokeWidth: 2, pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                style={{ ...inputStyle, paddingLeft: 32 }}
                placeholder="Search teams to add…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
              />
            </div>

            {/* Team list */}
            {teamsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: '2px solid var(--border2)',
                  borderTopColor: 'var(--accent-clr)',
                  animation: 'spin 0.7s linear infinite',
                }} />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: 'var(--muted-clr)' }}>
                No teams found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {filteredTeams.map((team) => {
                  const selected = selectedTeams.includes(team.id)
                  const disabled = !selected && selectedTeams.length >= maxTeams
                  const colour = team.homeColour ?? '#2d3050'
                  const bg = colour + '33'

                  return (
                    <div
                      key={team.id}
                      onClick={() => !disabled && toggleTeam(team.id)}
                      style={{
                        background: selected ? 'var(--accent-dim)' : 'var(--card2, #1d2035)',
                        border: `1px solid ${selected ? 'var(--accent-clr)' : 'var(--border)'}`,
                        borderRadius: 10,
                        padding: '13px 15px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1,
                        transition: 'border-color .15s, background .15s',
                      }}
                    >
                      {/* Team badge */}
                      <div style={{
                        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                        background: bg, border: `1px solid ${colour}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                        fontSize: 13, fontWeight: 700, color: colour,
                      }}>
                        {team.name.slice(0, 3).toUpperCase()}
                      </div>

                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }} className="truncate">
                          {team.name}
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `1.5px solid ${selected ? 'var(--accent-clr)' : 'var(--border2)'}`,
                        background: selected ? 'var(--accent-clr)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: 'auto', transition: 'all .15s',
                        color: '#000', fontSize: 11, fontWeight: 700,
                      }}>
                        {selected && '✓'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 8, borderTop: '1px solid var(--border)',
            }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid var(--border2)', background: 'transparent',
                  fontSize: 13, fontWeight: 500, color: 'var(--text2)',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onFinalSubmit}
                disabled={loading || selectedTeams.length !== maxTeams}
                style={{
                  padding: '10px 22px', borderRadius: 9,
                  background: loading || selectedTeams.length !== maxTeams ? 'var(--bg3)' : 'var(--accent-clr)',
                  color: loading || selectedTeams.length !== maxTeams ? 'var(--muted-clr)' : '#000',
                  fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: loading || selectedTeams.length !== maxTeams ? 'not-allowed' : 'pointer',
                  transition: 'background .15s',
                }}
              >
                {loading
                  ? 'Creating…'
                  : `Create Tournament (${selectedTeams.length}/${maxTeams} teams)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step indicator helper ──────────────────────────────────────────────────────

function StepIndicator({ num, label, state }: { num: number; label: string; state: 'idle' | 'active' | 'done' }) {
  const numStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
    border: `2px solid ${state === 'active' ? 'var(--accent-clr)' : state === 'done' ? 'var(--green)' : 'var(--border2)'}`,
    color: state === 'active' ? 'var(--accent-clr)' : state === 'done' ? 'var(--green)' : 'var(--muted-clr)',
    background: state === 'active' ? 'var(--accent-dim)' : state === 'done' ? 'var(--green-dim)' : 'var(--card2, #1d2035)',
    transition: 'all .3s',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <div style={numStyle}>{state === 'done' ? '✓' : num}</div>
      <div style={{
        fontSize: 12, fontWeight: 500,
        color: state === 'active' ? 'var(--text)' : state === 'done' ? 'var(--green)' : 'var(--muted-clr)',
        transition: 'color .3s',
      }}>
        {label}
      </div>
    </div>
  )
}
