'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RegisteredTeam {
  team: { id: string; name: string }
  group?: { id: string; name: string } | null
}

interface Group {
  id: string
  name: string
}

interface Props {
  tournamentId: string
  format: string
  teams: RegisteredTeam[]
  groups: Group[]
  matchCount: number
  matchTime: number
  playingMembers: number
  maxSubstitutes: number
  venue: string
}

type MatchType = 'group' | 'knockout'

const KNOCKOUT_ROUNDS = ['ROUND OF 32', 'PRE-QUARTER FINAL', 'QUARTER FINAL', 'SEMI-FINAL', 'FINAL']

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

export function CreateFixtureDialog({
  tournamentId, format, teams, groups, matchCount, matchTime, playingMembers, maxSubstitutes, venue: defaultVenue,
}: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)

  const isGroupKnockout = format === 'GROUP_KNOCKOUT'

  const [matchType, setMatchType]             = useState<MatchType>('group')
  const [matchNumber, setMatchNumber]         = useState(String(matchCount + 1))
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [homeTeamId, setHomeTeamId]           = useState('')
  const [awayTeamId, setAwayTeamId]           = useState('')
  const [scheduledAt, setScheduledAt]         = useState('')
  const [venue, setVenue]                     = useState(defaultVenue)
  const [round, setRound]                     = useState(isGroupKnockout ? 'GROUP' : '')
  const [matchTimeVal, setMatchTimeVal]       = useState(String(matchTime))
  const [playingCount, setPlayingCount]       = useState(String(playingMembers))
  const [subsCount, setSubsCount]             = useState(String(maxSubstitutes))

  const isGroupMatch = isGroupKnockout && matchType === 'group'

  const availableTeams = isGroupMatch && selectedGroupId
    ? teams.filter((t) => t.group?.id === selectedGroupId)
    : teams

  function reset() {
    setMatchType('group')
    setMatchNumber(String(matchCount + 1))
    setSelectedGroupId('')
    setHomeTeamId('')
    setAwayTeamId('')
    setScheduledAt('')
    setVenue(defaultVenue)
    setRound(isGroupKnockout ? 'GROUP' : '')
    setMatchTimeVal(String(matchTime))
    setPlayingCount(String(playingMembers))
    setSubsCount(String(maxSubstitutes))
  }

  function handleOpen(v: boolean) {
    setOpen(v)
    if (v) reset()
  }

  function handleMatchTypeChange(t: MatchType) {
    setMatchType(t)
    setSelectedGroupId('')
    setHomeTeamId('')
    setAwayTeamId('')
    setRound(t === 'group' ? 'GROUP' : '')
  }

  function handleGroupChange(gid: string) {
    setSelectedGroupId(gid)
    setHomeTeamId('')
    setAwayTeamId('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!homeTeamId || !awayTeamId || !scheduledAt) {
      toast.error('Home team, away team, and date/time are required')
      return
    }
    if (homeTeamId === awayTeamId) {
      toast.error('Home and away teams must be different')
      return
    }
    if (isGroupMatch && !selectedGroupId) {
      toast.error('Select a group for this match')
      return
    }

    setLoading(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeamId,
        awayTeamId,
        scheduledAt,
        venue:          venue || undefined,
        groupId:        isGroupMatch ? selectedGroupId : undefined,
        round:          round || undefined,
        matchOrder:     matchNumber ? parseInt(matchNumber) : undefined,
        matchTime:      matchTimeVal,
        playingMembers: playingCount,
        maxSubstitutes: subsCount,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to create fixture'); return }
    toast.success('Fixture created!')
    setOpen(false)
    router.refresh()
  }

  const teamDisabled = isGroupMatch && !selectedGroupId

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => handleOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8,
          background: 'var(--accent-clr)', color: '#000',
          fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add Fixture
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) handleOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn .15s ease',
            padding: 20,
          }}
        >
          {/* Modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg1)',
              border: '1px solid var(--border2)',
              borderRadius: 16,
              width: 480, maxWidth: 'calc(100vw - 40px)',
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
              <div style={{
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                fontSize: 17, fontWeight: 700, letterSpacing: '.2px', color: 'var(--text)',
              }}>
                Create Fixture
              </div>
              <button
                type="button"
                onClick={() => handleOpen(false)}
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
              <form
                id="fixture-form"
                onSubmit={handleSubmit}
                style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 13 }}
              >
                {/* Match # */}
                <Field label="Match #">
                  <input
                    type="number"
                    min={1}
                    value={matchNumber}
                    onChange={(e) => setMatchNumber(e.target.value)}
                    style={{ ...inputStyle, width: 100 }}
                    onFocus={onFocus} onBlur={onBlur}
                    tabIndex={-1}
                  />
                </Field>

                {/* Match type — GROUP_KNOCKOUT only */}
                {isGroupKnockout && (
                  <Field label="Match Type">
                    <div style={{
                      display: 'flex', gap: 0,
                      background: 'var(--bg2)',
                      border: '1px solid var(--border2)',
                      borderRadius: 8, overflow: 'hidden',
                      width: 'fit-content',
                    }}>
                      {(['group', 'knockout'] as MatchType[]).map((t) => {
                        const active = matchType === t
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleMatchTypeChange(t)}
                            style={{
                              padding: '7px 18px',
                              fontSize: 12, fontWeight: active ? 700 : 500,
                              cursor: 'pointer',
                              background: active ? 'var(--accent-clr)' : 'transparent',
                              color: active ? '#000' : 'var(--muted-clr)',
                              border: 'none',
                              fontFamily: 'inherit',
                              transition: 'all .2s',
                              textTransform: 'capitalize',
                            }}
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                )}

                {/* Group selector */}
                {isGroupMatch && (
                  <Field label="Group" required>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => handleGroupChange(e.target.value)}
                      style={inputStyle}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="">Select group…</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>Group {g.name}</option>
                      ))}
                    </select>
                    {selectedGroupId && availableTeams.length === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--orange)', marginTop: 3 }}>
                        No teams assigned to this group yet.
                      </span>
                    )}
                  </Field>
                )}

                {/* Round */}
                <Field label="Round">
                  <select
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    disabled={isGroupMatch}
                    style={{ ...inputStyle, opacity: isGroupMatch ? 0.65 : 1, cursor: isGroupMatch ? 'not-allowed' : 'pointer' }}
                    onFocus={isGroupMatch ? undefined : onFocus}
                    onBlur={isGroupMatch ? undefined : onBlur}
                  >
                    {isGroupMatch ? (
                      <option value="GROUP">Group</option>
                    ) : (
                      <>
                        <option value="">None</option>
                        {KNOCKOUT_ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </>
                    )}
                  </select>
                </Field>

                {/* Home + Away teams */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Home Team" required>
                    <select
                      value={homeTeamId}
                      onChange={(e) => setHomeTeamId(e.target.value)}
                      disabled={teamDisabled}
                      style={{ ...inputStyle, opacity: teamDisabled ? 0.5 : 1, cursor: teamDisabled ? 'not-allowed' : 'pointer' }}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="">{teamDisabled ? 'Pick group first' : 'Select team…'}</option>
                      {availableTeams.map(({ team }) => (
                        <option key={team.id} value={team.id} disabled={team.id === awayTeamId}>{team.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Away Team" required>
                    <select
                      value={awayTeamId}
                      onChange={(e) => setAwayTeamId(e.target.value)}
                      disabled={teamDisabled}
                      style={{ ...inputStyle, opacity: teamDisabled ? 0.5 : 1, cursor: teamDisabled ? 'not-allowed' : 'pointer' }}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="">{teamDisabled ? 'Pick group first' : 'Select team…'}</option>
                      {availableTeams.map(({ team }) => (
                        <option key={team.id} value={team.id} disabled={team.id === homeTeamId}>{team.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Date & Time + Venue */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Date & Time" required>
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
                </div>

                {/* Match settings box */}
                <div style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--muted-clr)', marginBottom: 2 }}>
                    Match settings <span style={{ fontStyle: 'italic' }}>(prefilled from tournament config)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <Field label="Match Time (min)">
                      <input
                        type="number" min={10} max={120}
                        value={matchTimeVal}
                        onChange={(e) => setMatchTimeVal(e.target.value)}
                        style={inputStyle}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </Field>
                    <Field label="Players">
                      <input
                        type="number" min={5} max={15}
                        value={playingCount}
                        onChange={(e) => setPlayingCount(e.target.value)}
                        style={inputStyle}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </Field>
                    <Field label="Substitutes">
                      <input
                        type="number" min={0} max={10}
                        value={subsCount}
                        onChange={(e) => setSubsCount(e.target.value)}
                        style={inputStyle}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </Field>
                  </div>
                </div>

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
                onClick={() => handleOpen(false)}
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
                form="fixture-form"
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
                {loading ? 'Creating…' : 'Create Fixture'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
