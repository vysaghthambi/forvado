'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  homeColour: string | null
  isAcceptingRequests: boolean
  _count: { members: number }
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  padding: '9px 12px 9px 32px',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .15s',
}

export function TeamJoinSearch({ myTeamIds }: { myTeamIds: string[] }) {
  const [search, setSearch] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams({ limit: '40' })
      if (search) params.set('q', search)
      fetch(`/api/teams?${params}`)
        .then((r) => r.json())
        .then((d) => setTeams(d.teams ?? []))
        .finally(() => setLoading(false))
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  async function requestToJoin(teamId: string, teamName: string) {
    setRequesting(teamId)
    const res = await fetch(`/api/teams/${teamId}/request`, { method: 'POST' })
    const data = await res.json()
    setRequesting(null)
    if (res.ok) toast.success(`Join request sent to ${teamName}`)
    else toast.error(data.error ?? 'Failed to send request')
  }

  // Filter out teams the user is already in
  const filteredTeams = teams.filter((t) => !myTeamIds.includes(t.id))

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{
        padding: '13px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{
          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
          textTransform: 'uppercase', color: 'var(--text2)',
        }}>
          Search &amp; Request to Join
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted-clr)' }}>
          Request sent to team captain for approval
        </span>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <svg
            viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, stroke: 'var(--muted-clr)', fill: 'none', strokeWidth: 2, pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            style={inputStyle}
            placeholder="Search by team name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
          />
        </div>

        {/* Results */}
        <div>
          {!loading && filteredTeams.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--muted-clr)', marginBottom: 8 }}>
              {search ? `${filteredTeams.length} team${filteredTeams.length !== 1 ? 's' : ''} found` : 'Showing all teams'}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid var(--border2)',
                borderTopColor: 'var(--accent-clr)',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 24, opacity: 0.35, marginBottom: 8 }}>👀</div>
              <div style={{ fontSize: 12, color: 'var(--muted-clr)' }}>No teams found.</div>
            </div>
          ) : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {filteredTeams.map((team, i) => {
                const colour = team.homeColour ?? '#2d3050'
                const bg = colour + '33'
                const initials = team.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                const isLast = i === filteredTeams.length - 1

                return (
                  <div
                    key={team.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 15px',
                      borderBottom: isLast ? 'none' : '1px solid rgba(35,38,56,.5)',
                      transition: 'background .1s',
                    }}
                    className="hover:bg-white/[0.025]"
                  >
                    {/* Badge */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: bg, border: `1px solid ${colour}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                      fontSize: 13, fontWeight: 700, color: colour,
                    }}>
                      {initials}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={`/teams/${team.id}`}
                        className="no-underline hover:underline"
                        style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}
                      >
                        {team.name}
                      </Link>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                        {team._count.members} player{team._count.members !== 1 ? 's' : ''}
                        {!team.isAcceptingRequests && ' · Closed'}
                      </div>
                    </div>

                    {/* Join button */}
                    {team.isAcceptingRequests ? (
                      <button
                        onClick={() => requestToJoin(team.id, team.name)}
                        disabled={requesting === team.id}
                        style={{
                          padding: '6px 13px', borderRadius: 7,
                          background: requesting === team.id ? 'var(--bg3)' : 'var(--accent-clr)',
                          color: requesting === team.id ? 'var(--muted-clr)' : '#000',
                          fontSize: 12, fontWeight: 600, border: 'none',
                          cursor: requesting === team.id ? 'not-allowed' : 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {requesting === team.id ? 'Sending…' : 'Request to Join'}
                      </button>
                    ) : (
                      <span style={{
                        padding: '5px 10px', borderRadius: 6,
                        border: '1px solid var(--border2)',
                        fontSize: 11, color: 'var(--muted-clr)', flexShrink: 0,
                      }}>
                        Closed
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
