'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'

interface OwnedTeam {
  id: string
  name: string
}

interface Props {
  tournamentId: string
  ownedTeams: OwnedTeam[]
  registeredTeamIds: string[]
  disabled?: boolean
  disabledReason?: string
}

export function RegisterTeamButton({ tournamentId, ownedTeams, registeredTeamIds, disabled, disabledReason }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [teamId, setTeamId] = useState('')
  const [loading, setLoading] = useState(false)

  const eligibleTeams = ownedTeams.filter((t) => !registeredTeamIds.includes(t.id))

  if (eligibleTeams.length === 0 && !disabled) return null

  async function handleRegister() {
    if (!teamId) { toast.error('Select a team'); return }
    setLoading(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to register'); return }
    toast.success('Team registered!')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5" disabled={disabled || eligibleTeams.length === 0}>
          <UserPlus className="h-4 w-4" />
          {disabledReason ?? 'Register Team'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Register Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Select your team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger><SelectValue placeholder="Choose a team" /></SelectTrigger>
              <SelectContent>
                {eligibleTeams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleRegister} disabled={loading || !teamId}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</> : 'Register'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
