'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Invitation {
  id: string
  type: string
  user: {
    id: string
    displayName: string
    avatarUrl: string | null
    position: string | null
    jerseyNumber: number | null
  }
}

const POSITION_LABELS: Record<string, string> = { GK: 'GK', DEF: 'DEF', MID: 'MID', FWD: 'FWD' }

export function InvitationsList({ teamId, invitations: initial }: { teamId: string; invitations: Invitation[] }) {
  const router = useRouter()
  const [invitations, setInvitations] = useState(initial)
  const [acting, setActing] = useState<string | null>(null)

  async function respond(invId: string, action: 'ACCEPT' | 'REJECT') {
    setActing(invId)
    const res = await fetch(`/api/teams/${teamId}/invitations/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Action failed')
    } else {
      toast.success(action === 'ACCEPT' ? 'Player added to team!' : 'Request declined')
      setInvitations((prev) => prev.filter((i) => i.id !== invId))
      router.refresh()
    }
    setActing(null)
  }

  const joinRequests = invitations.filter((i) => i.type === 'JOIN_REQUEST')
  const sentInvites = invitations.filter((i) => i.type === 'INVITE')

  function Section({ title, items }: { title: string; items: Invitation[] }) {
    if (items.length === 0) return null
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{title}</h3>
        <div className="space-y-2">
          {items.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3.5">
              <Avatar className="h-10 w-10">
                <AvatarImage src={inv.user.avatarUrl ?? ''} />
                <AvatarFallback className="text-sm">{inv.user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{inv.user.displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {inv.user.jerseyNumber && (
                    <span className="text-xs text-muted-foreground">#{inv.user.jerseyNumber}</span>
                  )}
                  {inv.user.position && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">{POSITION_LABELS[inv.user.position]}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => respond(inv.id, 'REJECT')}
                  disabled={acting === inv.id}
                >
                  {acting === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => respond(inv.id, 'ACCEPT')}
                  disabled={acting === inv.id}
                >
                  {acting === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-muted-foreground text-sm">No pending invitations or requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Section title="Join Requests" items={joinRequests} />
      <Section title="Sent Invitations (Pending)" items={sentInvites} />
    </div>
  )
}
