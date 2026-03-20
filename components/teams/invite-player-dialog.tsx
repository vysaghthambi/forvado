'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'
import { UserPlus, X, Search, Loader2, Check } from 'lucide-react'

interface User {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  role: string
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
  animation: 'fadeIn .15s ease',
}

const modalStyle: React.CSSProperties = {
  background: 'var(--bg1)',
  border: '1px solid var(--border2)',
  borderRadius: 16,
  width: 460, maxWidth: 'calc(100vw - 40px)',
  maxHeight: '85vh',
  display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,.6)',
  overflow: 'hidden',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  padding: '9px 12px 9px 36px',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .2s',
}

function Initials({ name }: { name: string }) {
  const letters = name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase()
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
      background: 'var(--bg2)', border: '1px solid var(--border2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
      fontSize: 12, fontWeight: 700, color: 'var(--text2)',
    }}>
      {letters}
    </div>
  )
}

export function AddPlayerDialog({ teamId, memberUserIds }: { teamId: string; memberUserIds: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<User[]>([])
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    if (!open) return
    async function search(q: string) {
      if (q.length < 2) { setResults([]); return }
      setSearching(true)
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.users ?? [])
      setSearching(false)
    }
    search(debouncedQuery)
  }, [debouncedQuery, open])

  function handleOpen() {
    setOpen(true)
    setQuery('')
    setResults([])
    setSelected([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleClose() {
    setOpen(false)
  }

  function toggleSelect(u: User) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === u.id)
      if (exists) return prev.filter((s) => s.id !== u.id)
      return [...prev, u]
    })
  }

  async function handleAdd() {
    if (selected.length === 0) return
    setSubmitting(true)
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selected.map((u) => u.id) }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to add players')
      return
    }
    toast.success(`${data.added} player${data.added !== 1 ? 's' : ''} added to the team`)
    handleClose()
    router.refresh()
  }

  const memberSet = new Set(memberUserIds)
  const selectedIds = new Set(selected.map((u) => u.id))

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 13px', borderRadius: 8,
          background: 'var(--accent-clr)', color: '#000',
          fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <UserPlus size={13} />
        Add Player
      </button>

      {open && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px',
              }}>
                Add Players
              </span>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted-clr)', padding: 4, borderRadius: 6, lineHeight: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search input */}
            <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--muted-clr)', pointerEvents: 'none',
                }} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by name or email…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent-clr)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border2)' }}
                />
              </div>
            </div>

            {/* Selected pills */}
            {selected.length > 0 && (
              <div style={{ padding: '10px 20px 0', flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.map((u) => (
                  <div key={u.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'var(--accent-clr)22', border: '1px solid var(--accent-clr)55',
                    borderRadius: 20, padding: '3px 8px 3px 8px',
                    fontSize: 11, color: 'var(--text)', fontWeight: 500,
                  }}>
                    {u.displayName}
                    <button
                      type="button"
                      onClick={() => toggleSelect(u)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, color: 'var(--muted-clr)' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Results list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 12px' }}>
              {searching && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', color: 'var(--muted-clr)', fontSize: 12 }}>
                  <Loader2 size={14} className="animate-spin" />
                  Searching…
                </div>
              )}
              {!searching && query.length >= 2 && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 0', fontSize: 12, color: 'var(--muted-clr)' }}>
                  No players found.
                </div>
              )}
              {!searching && query.length < 2 && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 0', fontSize: 12, color: 'var(--muted-clr)' }}>
                  Type at least 2 characters to search.
                </div>
              )}
              {!searching && results.map((u) => {
                const isAlreadyMember = memberSet.has(u.id)
                const isSelected = selectedIds.has(u.id)

                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isAlreadyMember}
                    onClick={() => !isAlreadyMember && toggleSelect(u)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 9,
                      cursor: isAlreadyMember ? 'default' : 'pointer',
                      opacity: isAlreadyMember ? 0.45 : 1,
                      textAlign: 'left',
                      background: isSelected ? 'var(--accent-clr)15' : 'transparent',
                      transition: 'background .12s',
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      if (!isAlreadyMember && !isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
                      else (e.currentTarget as HTMLElement).style.background = 'var(--accent-clr)15'
                    }}
                  >
                    <Initials name={u.displayName} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }} className="truncate">
                        {u.displayName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted-clr)' }} className="truncate">
                        {u.email}
                      </div>
                    </div>
                    {isAlreadyMember && (
                      <span style={{ fontSize: 10, color: 'var(--muted-clr)', flexShrink: 0 }}>Already a member</span>
                    )}
                    {isSelected && !isAlreadyMember && (
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--accent-clr)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={11} color="#000" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  background: 'none', border: '1px solid var(--border2)',
                  fontSize: 12, fontWeight: 500, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={selected.length === 0 || submitting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: selected.length === 0 ? 'var(--border2)' : 'var(--accent-clr)',
                  color: selected.length === 0 ? 'var(--muted-clr)' : '#000',
                  fontSize: 12, fontWeight: 600, border: 'none', cursor: selected.length === 0 ? 'default' : 'pointer',
                  fontFamily: 'inherit', transition: 'background .15s',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                {selected.length === 0 ? 'Add Players' : `Add ${selected.length} Player${selected.length !== 1 ? 's' : ''}`}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

// Keep old export name as alias for backwards compat with any remaining imports
export { AddPlayerDialog as InvitePlayerDialog }
