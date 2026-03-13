'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
  format: string
  teams: RegisteredTeam[]
  groups: Group[]
  matchCount: number
  matchTime: number
  playingMembers: number
  maxSubstitutes: number
}

type MatchType = 'group' | 'knockout'

export function CreateFixtureDialog({
  tournamentId, format, teams, groups, matchCount, matchTime, playingMembers, maxSubstitutes,
}: Props) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)

  const isGroupKnockout = format === 'GROUP_KNOCKOUT'

  // Match type toggle (only used for GROUP_KNOCKOUT)
  const [matchType, setMatchType] = useState<MatchType>('group')

  // Core fields
  const [matchNumber, setMatchNumber]   = useState(String(matchCount + 1))
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [homeTeamId, setHomeTeamId]     = useState('')
  const [awayTeamId, setAwayTeamId]     = useState('')
  const [scheduledAt, setScheduledAt]   = useState('')
  const [venue, setVenue]               = useState('')
  const [round, setRound]               = useState('')

  // Per-match overrides (prefilled from tournament config)
  const [matchTimeVal, setMatchTimeVal]   = useState(String(matchTime))
  const [playingCount, setPlayingCount]   = useState(String(playingMembers))
  const [subsCount, setSubsCount]         = useState(String(maxSubstitutes))

  const isGroupMatch = isGroupKnockout && matchType === 'group'

  // For group matches, only show teams in the selected group
  const availableTeams = isGroupMatch && selectedGroupId
    ? teams.filter((t) => t.group?.id === selectedGroupId)
    : teams

  function reset() {
    setMatchType('group')
    setMatchNumber(String(matchCount + 1))
    setSelectedGroupId('')
    setHomeTeamId('')
    setAwayTeamId('')
    setScheduledAt('')
    setVenue('')
    setRound('')
    setMatchTimeVal(String(matchTime))
    setPlayingCount(String(playingMembers))
    setSubsCount(String(maxSubstitutes))
  }

  function handleOpen(v: boolean) {
    setOpen(v)
    if (v) reset()
  }

  function handleMatchTypeChange(t: MatchType) {
    setMatchType(t)
    setSelectedGroupId('')
    setHomeTeamId('')
    setAwayTeamId('')
  }

  function handleGroupChange(gid: string) {
    setSelectedGroupId(gid)
    setHomeTeamId('')
    setAwayTeamId('')
  }

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
    if (isGroupMatch && !selectedGroupId) {
      toast.error('Select a group for this match')
      return
    }

    setLoading(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeamId,
        awayTeamId,
        scheduledAt,
        venue:          venue || undefined,
        groupId:        isGroupMatch ? selectedGroupId : undefined,
        round:          round || undefined,
        matchOrder:     matchNumber ? parseInt(matchNumber) : undefined,
        matchTime:      matchTimeVal,
        playingMembers: playingCount,
        maxSubstitutes: subsCount,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to create fixture'); return }
    toast.success('Fixture created!')
    setOpen(false)
    router.refresh()
  }

  const teamDisabled = isGroupMatch && !selectedGroupId

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Fixture</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fixture</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Match number */}
          <div className="space-y-1.5">
            <Label>Match #</Label>
            <Input
              type="number"
              min={1}
              value={matchNumber}
              onChange={(e) => setMatchNumber(e.target.value)}
              className="w-28"
            />
          </div>

          {/* Match type toggle — GROUP_KNOCKOUT only */}
          {isGroupKnockout && (
            <div className="space-y-1.5">
              <Label>Match Type</Label>
              <div className="flex w-fit overflow-hidden rounded-md border border-border">
                {(['group', 'knockout'] as MatchType[]).map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleMatchTypeChange(t)}
                    className={[
                      'px-4 py-1.5 text-sm transition-colors capitalize',
                      i > 0 ? 'border-l border-border' : '',
                      matchType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group selector — group matches only */}
          {isGroupMatch && (
            <div className="space-y-1.5">
              <Label>Group *</Label>
              <Select
                value={selectedGroupId || 'none'}
                onValueChange={(v) => handleGroupChange(v === 'none' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select group…</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>Group {g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGroupId && availableTeams.length === 0 && (
                <p className="text-xs text-amber-500">No teams assigned to this group yet.</p>
              )}
            </div>
          )}

          {/* Teams */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Home Team *</Label>
              <Select value={homeTeamId} onValueChange={setHomeTeamId} disabled={teamDisabled}>
                <SelectTrigger>
                  <SelectValue placeholder={teamDisabled ? 'Pick group first' : 'Select team'} />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map(({ team }) => (
                    <SelectItem key={team.id} value={team.id} disabled={team.id === awayTeamId}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Away Team *</Label>
              <Select value={awayTeamId} onValueChange={setAwayTeamId} disabled={teamDisabled}>
                <SelectTrigger>
                  <SelectValue placeholder={teamDisabled ? 'Pick group first' : 'Select team'} />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map(({ team }) => (
                    <SelectItem key={team.id} value={team.id} disabled={team.id === homeTeamId}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          {/* Venue & Round */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <Input placeholder="Optional" value={venue} onChange={(e) => setVenue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Round</Label>
              <Input placeholder="e.g. Semi-Final" value={round} onChange={(e) => setRound(e.target.value)} />
            </div>
          </div>

          <Separator />

          {/* Per-match overrides */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Match settings (prefilled from tournament config)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Match Time (min)</Label>
                <Input
                  type="number"
                  min={10}
                  max={120}
                  value={matchTimeVal}
                  onChange={(e) => setMatchTimeVal(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Players</Label>
                <Input
                  type="number"
                  min={5}
                  max={15}
                  value={playingCount}
                  onChange={(e) => setPlayingCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Substitutes</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={subsCount}
                  onChange={(e) => setSubsCount(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
              : 'Create Fixture'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
