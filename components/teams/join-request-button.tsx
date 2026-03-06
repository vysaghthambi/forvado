'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  teamId: string
  isAccepting: boolean
  existingPending: boolean
}

export function JoinRequestButton({ teamId, isAccepting, existingPending }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isAccepting) return null

  if (existingPending) {
    return (
      <Button variant="outline" size="sm" disabled>
        Request Pending
      </Button>
    )
  }

  async function handleRequest() {
    setLoading(true)
    const res = await fetch(`/api/teams/${teamId}/request`, { method: 'POST' })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to send request')
    } else {
      toast.success('Join request sent!')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button size="sm" onClick={handleRequest} disabled={loading}>
      {loading ? 'Sending…' : 'Request to Join'}
    </Button>
  )
}
