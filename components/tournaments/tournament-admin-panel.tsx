'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Coordinator {
  id: string
  user: { id: string; displayName: string; avatarUrl: string | null; email: string }
}

interface Group {
  id: string
  name: string
  teams: { team: { id: string; name: string } }[]
}

interface RegisteredTeam {
  team: { id: string; name: string; badgeUrl: string | null; homeColour?: string | null; shortCode?: string | null }
  group?: { id: string; name: string } | null
}

interface AvailableTeam { id: string; name: string }

interface Props {
  tournamentId: string
  status: string
  isPublished: boolean
  coordinators: Coordinator[]
  groups: Group[]
  teams: RegisteredTeam[]
  maxTeams: number
  format: string
  isAdmin: boolean
}

const STATUS_OPTIONS = [
  { value: 'DRAFT',     label: 'Draft',     desc: 'Not published. Only visible to admins.' },
  { value: 'UPCOMING',  label: 'Upcoming',  desc: 'Tournament is scheduled but not yet started.' },
  { value: 'ONGOING',   label: 'Ongoing',   desc: 'Tournament is active and matches are being played.' },
  { value: 'COMPLETED', label: 'Completed', desc: 'All matches played and results are final.' },
]

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}

function TeamBadge({ name, colour, shortCode }: { name: string; colour?: string | null; shortCode?: string | null }) {
  const c = colour ?? '#2d3050'
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
      background: c + '33', border: `1px solid ${c}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
      fontSize: 9, fontWeight: 700, color: c, letterSpacing: '0.5px',
    }}>
      {shortCode ?? name.slice(0, 3).toUpperCase()}
    </div>
  )
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        padding: '13px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{
          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
          textTransform: 'uppercase' as const, color: 'var(--muted-foreground)',
        }}>
          {title}
        </span>
        {action}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

export function TournamentAdminPanel({ tournamentId, status, isPublished, coordinators, groups, teams, maxTeams, format, isAdmin }: Props) {
  const router = useRouter()
  const [loadingPublish, setLoadingPublish] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [loadingGroup, setLoadingGroup] = useState(false)
  const [loadingCoordinator, setLoadingCoordinator] = useState('')
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<{ teamId: string; name: string } | null>(null)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<{ groupId: string; name: string } | null>(null)
  const [coordSearch, setCoordSearch] = useState('')
  const [coordResults, setCoordResults] = useState<{ id: string; displayName: string; email: string }[]>([])
  const [coordSearching, setCoordSearching] = useState(false)
  const [selectedCoordUser, setSelectedCoordUser] = useState<{ id: string; displayName: string } | null>(null)
  const coordDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([])
  const [teamsSearch, setTeamsSearch] = useState('')
  const [loadingAddTeam, setLoadingAddTeam] = useState('')
  const [loadingRemoveTeam, setLoadingRemoveTeam] = useState('')

  const registeredIds = new Set(teams.map((t) => t.team.id))
  const unassignedCount = format === 'GROUP_KNOCKOUT' ? teams.filter((t) => !t.group).length : 0

  useEffect(() => {
    fetch('/api/teams?limit=50').then((r) => r.json()).then((d) => setAvailableTeams(d.teams ?? []))
  }, [])

  const addableTeams = availableTeams.filter(
    (t) => !registeredIds.has(t.id) && t.name.toLowerCase().includes(teamsSearch.toLowerCase())
  )

  async function addTeam(teamId: string) {
    setLoadingAddTeam(teamId)
    const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    })
    const data = await res.json()
    setLoadingAddTeam('')
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Team added'); setTeamsSearch(''); router.refresh()
  }

  async function removeTeam(teamId: string) {
    setConfirmDeleteTeam(null)
    setLoadingRemoveTeam(teamId)
    const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, { method: 'DELETE' })
    const data = await res.json()
    setLoadingRemoveTeam('')
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Team removed'); router.refresh()
  }

  async function togglePublish() {
    setLoadingPublish(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/publish`, { method: 'POST' })
    const data = await res.json()
    setLoadingPublish(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success(data.isPublished ? 'Tournament published' : 'Tournament unpublished'); router.refresh()
  }

  async function changeStatus(newStatus: string) {
    setLoadingStatus(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    setLoadingStatus(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Status updated'); router.refresh()
  }

  async function createGroup() {
    if (!newGroupName.trim()) return
    setLoadingGroup(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/groups`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() }),
    })
    const data = await res.json()
    setLoadingGroup(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success(`Group "${newGroupName}" created`); setNewGroupName(''); router.refresh()
  }

  async function deleteGroup(groupId: string) {
    setConfirmDeleteGroup(null)
    const res = await fetch(`/api/tournaments/${tournamentId}/groups/${groupId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Group deleted'); router.refresh()
  }

  async function assignToGroup(teamId: string, gid: string) {
    if (!gid) {
      const current = teams.find((t) => t.team.id === teamId)
      if (!current?.group) return
      await fetch(`/api/tournaments/${tournamentId}/groups/${current.group.id}/teams`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
    } else {
      await fetch(`/api/tournaments/${tournamentId}/groups/${gid}/teams`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
    }
    router.refresh()
  }

  async function removeCoordinator(userId: string) {
    setLoadingCoordinator(userId)
    const res = await fetch(`/api/tournaments/${tournamentId}/coordinators/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    setLoadingCoordinator('')
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Coordinator removed'); router.refresh()
  }

  async function addCoordinator() {
    if (!selectedCoordUser) return
    setLoadingCoordinator('adding')
    const res = await fetch(`/api/tournaments/${tournamentId}/coordinators`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedCoordUser.id }),
    })
    const data = await res.json()
    setLoadingCoordinator('')
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Coordinator assigned')
    setSelectedCoordUser(null); setCoordSearch(''); setCoordResults([])
    router.refresh()
  }

  function handleCoordSearch(q: string) {
    setCoordSearch(q); setSelectedCoordUser(null)
    if (coordDebounce.current) clearTimeout(coordDebounce.current)
    if (q.length < 2) { setCoordResults([]); return }
    coordDebounce.current = setTimeout(async () => {
      setCoordSearching(true)
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCoordSearching(false); setCoordResults(data.users ?? [])
    }, 300)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 7,
    border: '1px solid var(--border)', background: 'var(--bg3)',
    color: 'var(--text)', fontSize: 12, outline: 'none',
  }

  const btnGhost: React.CSSProperties = {
    padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text2)', fontSize: 11,
    fontWeight: 500, cursor: 'pointer',
  }

  const btnAccent: React.CSSProperties = {
    padding: '5px 12px', borderRadius: 7, border: 'none',
    background: 'var(--accent-clr)', color: '#000',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
  }

  const btnDanger: React.CSSProperties = {
    padding: '3px 8px', borderRadius: 6, border: '1px solid var(--live)',
    background: 'transparent', color: 'var(--live)', fontSize: 10,
    fontWeight: 500, cursor: 'pointer',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>

      {/* ── Left col ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Status */}
        {isAdmin && (
          <SectionCard
            title="Tournament Status"
            action={
              <button
                onClick={!isPublished ? togglePublish : undefined}
                disabled={loadingPublish || isPublished}
                title={isPublished ? 'Published tournaments cannot be unpublished' : undefined}
                style={{
                  ...btnGhost,
                  color: isPublished ? 'var(--green)' : 'var(--muted-clr)',
                  borderColor: isPublished ? 'var(--green)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  cursor: isPublished ? 'default' : 'pointer',
                  opacity: isPublished ? 1 : undefined,
                }}
              >
                {loadingPublish ? <Spinner /> : (isPublished ? '✓ Published' : '○ Publish')}
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STATUS_OPTIONS.map((opt) => {
                const active = status === opt.value
                return (
                  <div
                    key={opt.value}
                    onClick={() => !loadingStatus && changeStatus(opt.value)}
                    style={{
                      background: active ? 'var(--accent-dim)' : 'var(--card2, #1d2035)',
                      border: `1px solid ${active ? 'var(--accent-clr)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: loadingStatus ? 'wait' : 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    {/* Radio */}
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${active ? 'var(--accent-clr)' : 'var(--border2)'}`,
                      background: active ? 'var(--accent-clr)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-clr)', marginTop: 1 }}>{opt.desc}</div>
                    </div>
                    {loadingStatus && active && <Spinner />}
                  </div>
                )
              })}
            </div>
          </SectionCard>
        )}

        {/* Coordinators */}
        {isAdmin && (
          <SectionCard title="Coordinators">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Search + Add */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <svg viewBox="0 0 24 24" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, stroke: 'var(--muted-clr)', fill: 'none', strokeWidth: 2, pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    style={{ ...inputStyle, paddingLeft: 30 }}
                    placeholder="Search by name or email…"
                    value={coordSearch}
                    onChange={(e) => handleCoordSearch(e.target.value)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border2)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                  {coordSearching && (
                    <div style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)' }}><Spinner /></div>
                  )}
                </div>
                <button
                  onClick={addCoordinator}
                  disabled={loadingCoordinator === 'adding' || !selectedCoordUser}
                  style={{ ...btnAccent, opacity: !selectedCoordUser ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {loadingCoordinator === 'adding' ? <Spinner /> : '+ Add'}
                </button>
              </div>

              {/* Search results dropdown */}
              {coordResults.length > 0 && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {coordResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedCoordUser({ id: u.id, displayName: u.displayName }); setCoordSearch(u.displayName); setCoordResults([]) }}
                      style={{
                        width: '100%', display: 'flex', flexDirection: 'column', gap: 1,
                        padding: '9px 12px', textAlign: 'left', background: 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(35,38,56,.5)', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{u.displayName}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted-clr)' }}>{u.email}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Coordinator list */}
              {coordinators.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--muted-clr)', padding: '8px 0' }}>No coordinators assigned yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {coordinators.map(({ user }) => (
                    <div key={user.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--accent-dim)', color: 'var(--accent-clr)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }} className="truncate">{user.displayName}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted-clr)' }} className="truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => removeCoordinator(user.id)}
                        disabled={loadingCoordinator === user.id}
                        style={{ ...btnDanger, display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        {loadingCoordinator === user.id ? <Spinner /> : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      {/* ── Right col ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Teams */}
        {isAdmin && (
          <SectionCard
            title={`Teams  ${teams.length}/${maxTeams}`}
            action={
              unassignedCount > 0 ? (
                <span style={{ fontSize: 10, color: 'var(--orange)', background: 'var(--orange-dim)', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                  {unassignedCount} unassigned
                </span>
              ) : undefined
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Registered teams list */}
              {teams.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {teams.map(({ team, group }) => (
                    <div key={team.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--bg3)',
                    }}>
                      <TeamBadge name={team.name} colour={team.homeColour} shortCode={team.shortCode} />
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', minWidth: 0 }} className="truncate">{team.name}</span>
                      {group && <span style={{ fontSize: 10, color: 'var(--muted-clr)' }}>Grp {group.name}</span>}
                      <button
                        onClick={() => setConfirmDeleteTeam({ teamId: team.id, name: team.name })}
                        disabled={loadingRemoveTeam === team.id}
                        style={{ ...btnDanger, display: 'flex', alignItems: 'center' }}
                      >
                        {loadingRemoveTeam === team.id ? <Spinner /> : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add teams search */}
              {teams.length < maxTeams && (
                <>
                  <div style={{ position: 'relative' }}>
                    <svg viewBox="0 0 24 24" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, stroke: 'var(--muted-clr)', fill: 'none', strokeWidth: 2, pointerEvents: 'none' }}>
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      style={{ ...inputStyle, paddingLeft: 30 }}
                      placeholder="Search teams to add…"
                      value={teamsSearch}
                      onChange={(e) => setTeamsSearch(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border2)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                    />
                  </div>
                  {teamsSearch && (
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxHeight: 160, overflowY: 'auto' }}>
                      {addableTeams.length === 0 ? (
                        <div style={{ padding: '10px 12px', fontSize: 11, color: 'var(--muted-clr)' }}>No teams found</div>
                      ) : (
                        addableTeams.map((t) => (
                          <div key={t.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderBottom: '1px solid rgba(35,38,56,.5)',
                          }}>
                            <span style={{ fontSize: 12, color: 'var(--text)' }}>{t.name}</span>
                            <button
                              onClick={() => addTeam(t.id)}
                              disabled={loadingAddTeam === t.id}
                              style={{ ...btnAccent, padding: '3px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              {loadingAddTeam === t.id ? <Spinner /> : '+ Add'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </SectionCard>
        )}

        {/* Groups */}
        <SectionCard
          title="Groups"
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ ...inputStyle, width: 100, padding: '4px 8px' }}
                placeholder="e.g. A"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              />
              <button
                onClick={createGroup}
                disabled={loadingGroup || !newGroupName.trim()}
                style={{ ...btnAccent, padding: '4px 10px', opacity: !newGroupName.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {loadingGroup ? <Spinner /> : '+ Add'}
              </button>
            </div>
          }
        >
          {groups.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--muted-clr)', padding: '4px 0' }}>No groups yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groups.map((g) => (
                <div key={g.id} style={{
                  background: 'var(--card2, #1d2035)',
                  border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
                }}>
                  {/* Group header */}
                  <div style={{
                    padding: '10px 14px', background: 'var(--bg3)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      Group {g.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--muted-clr)' }}>{g.teams.length} team{g.teams.length !== 1 ? 's' : ''}</span>
                      <button onClick={() => setConfirmDeleteGroup({ groupId: g.id, name: g.name })} style={btnDanger}>Remove</button>
                    </div>
                  </div>
                  {/* Teams in group */}
                  {g.teams.map(({ team }) => (
                    <div key={team.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', borderBottom: '1px solid rgba(35,38,56,.5)',
                      fontSize: 12, color: 'var(--text)',
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-heading), Rajdhani, sans-serif', color: 'var(--text2)' }}>
                        {team.name.slice(0, 3).toUpperCase()}
                      </div>
                      {team.name}
                    </div>
                  ))}
                  {g.teams.length === 0 && (
                    <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--muted-clr)' }}>No teams assigned</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Assign Teams to Groups */}
        {groups.length > 0 && teams.length > 0 && (
          <SectionCard title="Assign Teams to Groups">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teams.map(({ team, group }) => (
                <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', minWidth: 0 }} className="truncate">{team.name}</span>
                  <select
                    value={group?.id ?? ''}
                    onChange={(e) => assignToGroup(team.id, e.target.value)}
                    style={{
                      padding: '5px 8px', borderRadius: 7,
                      border: '1px solid var(--border)', background: 'var(--bg3)',
                      color: 'var(--text)', fontSize: 11, outline: 'none', width: 120,
                    }}
                  >
                    <option value="">No group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>Group {g.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>

    {/* ── Confirm delete team ─────────────────────────── */}
    {confirmDeleteTeam && (
      <div
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteTeam(null) }}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 16, width: 380, maxWidth: 'calc(100vw - 40px)', boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Remove Team</span>
            <button onClick={() => setConfirmDeleteTeam(null)} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted-clr)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Remove <span style={{ fontWeight: 600, color: 'var(--text)' }}>{confirmDeleteTeam.name}</span> from this tournament?
            </p>
          </div>
          <div style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setConfirmDeleteTeam(null)} style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => removeTeam(confirmDeleteTeam.teamId)} style={{ padding: '7px 18px', borderRadius: 8, background: 'var(--live)', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Confirm delete group ─────────────────────────── */}
    {confirmDeleteGroup && (
      <div
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteGroup(null) }}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 16, width: 380, maxWidth: 'calc(100vw - 40px)', boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Delete Group</span>
            <button onClick={() => setConfirmDeleteGroup(null)} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted-clr)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Delete <span style={{ fontWeight: 600, color: 'var(--text)' }}>Group {confirmDeleteGroup.name}</span>? Teams in this group will be unassigned.
            </p>
          </div>
          <div style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setConfirmDeleteGroup(null)} style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => deleteGroup(confirmDeleteGroup.groupId)} style={{ padding: '7px 18px', borderRadius: 8, background: 'var(--live)', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      </div>
    )}
  )
}
