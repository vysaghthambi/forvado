'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'

type Role = 'PLAYER' | 'TEAM_OWNER' | 'COORDINATOR' | 'ADMIN'

interface AdminUser {
  id: string
  displayName: string
  email: string
  role: Role
  profileComplete: boolean
  createdAt: string
  _count: { teamMemberships: number }
}

const ROLE_OPTIONS: { value: Role | ''; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'TEAM_OWNER', label: 'Team Owner' },
  { value: 'PLAYER', label: 'Player' },
]

const ROLE_STYLE: Record<Role, { label: string; color: string; bg: string }> = {
  ADMIN:       { label: 'Admin',       color: 'var(--accent-clr)', bg: 'var(--accent-dim)' },
  COORDINATOR: { label: 'Coordinator', color: 'var(--purple)',     bg: 'var(--purple-dim)' },
  TEAM_OWNER:  { label: 'Team Owner',  color: 'var(--blue)',       bg: 'var(--blue-dim)'   },
  PLAYER:      { label: 'Player',      color: 'var(--muted-clr)',  bg: 'rgba(94,98,128,.15)' },
}

const ROLE_COLOURS: Record<Role, { bg: string; text: string }> = {
  ADMIN:       { bg: '#2a1e00', text: '#f5c842' },
  COORDINATOR: { bg: '#1e1535', text: '#a855f7' },
  TEAM_OWNER:  { bg: '#1a2040', text: '#3d8eff' },
  PLAYER:      { bg: '#1a1d2a', text: '#9298b8' },
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  padding: '6px 10px 6px 30px',
  fontSize: 12,
  color: 'var(--text)',
  outline: 'none',
  width: 188,
  fontFamily: 'inherit',
  transition: 'border-color .15s',
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 12,
  color: 'var(--text)',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color .15s',
}

export function AdminUsersTable({ initialUsers, currentUserId }: { initialUsers: AdminUser[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      const matchesQ = !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchesRole = !roleFilter || u.role === roleFilter
      return matchesQ && matchesRole
    })
  }, [users, search, roleFilter])

  async function changeRole(userId: string, newRole: Role) {
    setUpdating(userId)
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    const data = await res.json()
    setUpdating(null)
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to update role')
      return
    }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    toast.success('Role updated')
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{
        padding: '13px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
          textTransform: 'uppercase', color: 'var(--text2)',
        }}>
          All Users
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg
              viewBox="0 0 24 24"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, stroke: 'var(--muted-clr)', fill: 'none', strokeWidth: 2, pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              style={inputStyle}
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
            />
          </div>

          {/* Role filter */}
          <select
            style={selectStyle}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              {['User', 'Email', 'Role', 'Teams', 'Joined', 'Status'].map((h, i) => (
                <th key={h} style={{
                  fontSize: 10, fontWeight: 500, color: 'var(--muted-clr)',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  padding: '9px 14px', textAlign: i >= 2 ? 'center' : 'left',
                  borderBottom: '1px solid var(--border)',
                  background: 'rgba(255,255,255,.015)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted-clr)', fontSize: 12 }}>
                  No users found.
                </td>
              </tr>
            ) : filtered.map((u, i) => {
              const rs = ROLE_STYLE[u.role]
              const rc = ROLE_COLOURS[u.role]
              const initials = u.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
              const isLast = i === filtered.length - 1
              const isSelf = u.id === currentUserId

              return (
                <tr
                  key={u.id}
                  className="hover:bg-white/[0.025] transition-colors"
                  style={{ borderBottom: isLast ? 'none' : '1px solid rgba(35,38,56,.7)', cursor: 'default' }}
                >
                  {/* User */}
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: rc.bg, border: `1px solid ${rc.text}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                        fontSize: 11, fontWeight: 700, color: rc.text,
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {u.displayName}
                          {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--muted-clr)' }}>(you)</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {u.email}
                  </td>

                  {/* Role — inline change dropdown */}
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                    {isSelf ? (
                      <span style={{
                        display: 'inline-flex', padding: '3px 9px', borderRadius: 5,
                        fontSize: 11, fontWeight: 600,
                        color: rs.color, background: rs.bg,
                      }}>
                        {rs.label}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={updating === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value as Role)}
                        style={{
                          background: rs.bg, border: `1px solid ${rs.color}55`,
                          borderRadius: 6, padding: '3px 7px',
                          fontSize: 11, fontWeight: 600, color: rs.color,
                          outline: 'none', cursor: 'pointer',
                          opacity: updating === u.id ? 0.6 : 1,
                          fontFamily: 'inherit',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = rs.color)}
                        onBlur={(e) => (e.target.style.borderColor = rs.color + '55')}
                      >
                        <option value="PLAYER">Player</option>
                        <option value="TEAM_OWNER">Team Owner</option>
                        <option value="COORDINATOR">Coordinator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    )}
                  </td>

                  {/* Teams */}
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>
                    {u._count.teamMemberships}
                  </td>

                  {/* Joined */}
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center', fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {format(new Date(u.createdAt), 'MMM yyyy')}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                    {u.profileComplete ? (
                      <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'var(--green-dim)' }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, color: 'var(--orange)', background: 'var(--orange-dim)' }}>
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted-clr)' }}>
          {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
