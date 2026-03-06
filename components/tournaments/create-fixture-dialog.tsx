'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

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
  teams: RegisteredTeam[]
  groups: Group[]
}

export function CreateFixtureDialog({ tournamentId, teams, groups }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [venue, setVenue] = useState('')
  const [groupId, setGroupId] = useState('')
  const [round, setRound] = useState('')

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

    setLoading(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeamId, awayTeamId, scheduledAt,
        venue: venue || undefined,
        groupId: groupId || undefined,
        round: round || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create fixture')
      return
    }
    toast.success('Fixture created!')
    setOpen(false)
    setHomeTeamId(''); setAwayTeamId(''); setScheduledAt(''); setVenue(''); setGroupId(''); setRound('')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Fixture</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Fixture</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Home Team *</Label>
              <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.map(({ team }) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Away Team *</Label>
              <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.map(({ team }) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Venue</Label>
            <Input placeholder="Optional venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {groups.length > 0 && (
              <div className="space-y-1.5">
                <Label>Group</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>Group {g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Round</Label>
              <Input placeholder="e.g. Semi-Final" value={round} onChange={(e) => setRound(e.target.value)} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Fixture'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
