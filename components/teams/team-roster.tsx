'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserMinus, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Member {
  userId: string
  role: string
  jerseyNumber: number | null
  user: { id: string; displayName: string; avatarUrl: string | null; position: string | null }
}

const POSITION_LABELS: Record<string, string> = { GK: 'GK', DEF: 'DEF', MID: 'MID', FWD: 'FWD' }

// Position sort order
const POS_ORDER = ['GK', 'DEF', 'MID', 'FWD']

interface Props {
  teamId: string
  members: Member[]
  isOwner: boolean
  ownerId: string
}

export function TeamRoster({ teamId, members, isOwner, ownerId }: Props) {
  const router = useRouter()
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string } | null>(null)

  async function removeMember(userId: string, name: string) {
    setConfirmRemove(null)
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to remove member'); return }
    toast.success(`${name} removed`)
    router.refresh()
  }

  // Sort: captain first, then by position, then by jersey number
  const sorted = [...members].sort((a, b) => {
    if (a.role === 'CAPTAIN') return -1
    if (b.role === 'CAPTAIN') return 1
    if (a.role === 'VICE_CAPTAIN' && b.role !== 'CAPTAIN') return -1
    if (b.role === 'VICE_CAPTAIN' && a.role !== 'CAPTAIN') return 1
    const pa = POS_ORDER.indexOf(a.user.position ?? '') ?? 99
    const pb = POS_ORDER.indexOf(b.user.position ?? '') ?? 99
    if (pa !== pb) return pa - pb
    return (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99)
  })

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card py-10 text-center">
        <p className="text-sm text-muted-foreground">No members yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {sorted.map((m, i) => (
        <div
          key={m.userId}
          className={cn(
            'flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors',
            i < sorted.length - 1 && 'border-b border-border/30'
          )}
        >
          {/* Jersey number circle */}
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
              m.role === 'CAPTAIN'
                ? 'bg-primary text-primary-foreground'
                : m.role === 'VICE_CAPTAIN'
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {m.jerseyNumber ?? '—'}
          </div>

          {/* Avatar */}
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={m.user.avatarUrl ?? ''} />
            <AvatarFallback className="text-xs">{m.user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>

          {/* Name + position */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold">{m.user.displayName}</span>
            {m.user.position && (
              <span className="ml-2 text-xs text-muted-foreground">
                {POSITION_LABELS[m.user.position] ?? m.user.position}
              </span>
            )}
          </div>

          {/* Role badge */}
          {m.role === 'CAPTAIN' && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-400">
              <Star className="h-3 w-3 fill-amber-400" /> Captain
            </span>
          )}
          {m.role === 'VICE_CAPTAIN' && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star className="h-3 w-3" /> Vice Cap
            </span>
          )}

          {/* Remove button (owner only, can't remove yourself if you're owner) */}
          {isOwner && m.userId !== ownerId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => setConfirmRemove({ userId: m.userId, name: m.user.displayName })}
            >
              <UserMinus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}

      {/* ── Confirm remove member dialog ── */}
      {confirmRemove && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmRemove(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 16, width: 380, maxWidth: 'calc(100vw - 40px)', boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Remove Player</span>
              <button onClick={() => setConfirmRemove(null)} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted-clr)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Remove <span style={{ fontWeight: 600, color: 'var(--text)' }}>{confirmRemove.name}</span> from the team?
              </p>
            </div>
            <div style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setConfirmRemove(null)} style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => removeMember(confirmRemove.userId, confirmRemove.name)} style={{ padding: '7px 18px', borderRadius: 8, background: 'var(--live)', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
