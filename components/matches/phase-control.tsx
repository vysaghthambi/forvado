'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  matchId: string
  status: string
}

const NEXT_LABEL: Record<string, string> = {
  SCHEDULED: 'Start Match (Kick Off)',
  FIRST_HALF: 'Half Time',
  HALF_TIME: 'Second Half',
  SECOND_HALF: 'Full Time',
  FULL_TIME: 'Complete Match (Normal Time)',
  EXTRA_TIME_FIRST_HALF: 'Extra Time Half Time',
  EXTRA_TIME_HALF_TIME: 'Extra Time Second Half',
  EXTRA_TIME_SECOND_HALF: 'Extra Time Full Time',
  EXTRA_TIME_FULL_TIME: 'Complete Match (After Extra Time)',
  PENALTY_SHOOTOUT: 'Complete Match (After Penalties)',
}

const CAN_GO_EXTRA = ['FULL_TIME']
const CAN_GO_PENALTIES = ['FULL_TIME', 'EXTRA_TIME_FULL_TIME']
const TERMINAL = ['COMPLETED', 'CANCELLED', 'POSTPONED']

export function PhaseControl({ matchId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function advance(endpoint: string, label: string) {
    setLoading(label)
    const res = await fetch(endpoint, { method: 'POST' })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success(`Phase updated`)
    router.refresh()
  }

  if (TERMINAL.includes(status)) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Match is {status.toLowerCase()}.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
      <h3 className="text-sm font-semibold">Phase Control</h3>

      {NEXT_LABEL[status] && (
        <Button
          className="w-full"
          onClick={() => advance(`/api/matches/${matchId}/phase/next`, 'next')}
          disabled={loading !== null}
        >
          {loading === 'next' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : `→ ${NEXT_LABEL[status]}`}
        </Button>
      )}

      {CAN_GO_EXTRA.includes(status) && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => advance(`/api/matches/${matchId}/phase/extra-time`, 'et')}
          disabled={loading !== null}
        >
          {loading === 'et' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : '→ Extra Time'}
        </Button>
      )}

      {CAN_GO_PENALTIES.includes(status) && (
        <Button
          variant="outline"
          className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          onClick={() => advance(`/api/matches/${matchId}/phase/penalties`, 'pso')}
          disabled={loading !== null}
        >
          {loading === 'pso' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : '→ Penalty Shootout'}
        </Button>
      )}
    </div>
  )
}
