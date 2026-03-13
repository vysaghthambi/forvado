'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search, ArrowLeft, Check } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  format: z.enum(['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT'], { error: 'Select a format' }),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  venue: z.string().optional(),
  maxTeams: z.string().min(1, 'Max teams required'),
  matchTime: z.string().optional(),
  playingMembers: z.string().optional(),
  maxSubstitutes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Team {
  id: string
  name: string
  badgeUrl: string | null
}

export function CreateTournamentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [step1Data, setStep1Data] = useState<FormValues | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { matchTime: '90', playingMembers: '11', maxSubstitutes: '5' },
  })

  const maxTeams = parseInt(watch('maxTeams') || '0')

  useEffect(() => {
    if (step === 2) {
      setTeamsLoading(true)
      fetch('/api/teams?limit=50')
        .then((r) => r.json())
        .then((d) => setTeams(d.teams ?? []))
        .finally(() => setTeamsLoading(false))
    }
  }, [step])

  function onStep1Submit(values: FormValues) {
    setStep1Data(values)
    setStep(2)
  }

  async function onFinalSubmit() {
    if (!step1Data) return
    if (selectedTeams.length !== maxTeams) {
      toast.error(`Select exactly ${maxTeams} teams`)
      return
    }
    setLoading(true)
    const res = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...step1Data, teamIds: selectedTeams }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create tournament')
      return
    }
    toast.success('Tournament created!')
    router.push(`/tournaments/${data.tournament.id}`)
  }

  function toggleTeam(teamId: string) {
    setSelectedTeams((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId)
      if (prev.length >= maxTeams) return prev
      return [...prev, teamId]
    })
  }

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Select Teams</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedTeams.length} / {maxTeams} selected
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Back
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {teamsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No teams found</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {filteredTeams.map((team) => {
              const selected = selectedTeams.includes(team.id)
              const disabled = !selected && selectedTeams.length >= maxTeams
              return (
                <div
                  key={team.id}
                  onClick={() => !disabled && toggleTeam(team.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    selected
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/30'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'}`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    selected ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm flex-1 truncate">{team.name}</span>
                </div>
              )
            })}
          </div>
        )}

        <Button
          className="w-full"
          onClick={onFinalSubmit}
          disabled={loading || selectedTeams.length !== maxTeams}
        >
          {loading
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
            : `Create Tournament (${selectedTeams.length}/${maxTeams} teams)`}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input placeholder="e.g. City Cup 2025" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="Optional tournament description" rows={3} {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Format *</Label>
          <Select onValueChange={(v) => setValue('format', v as 'LEAGUE' | 'KNOCKOUT' | 'GROUP_KNOCKOUT')}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LEAGUE">League</SelectItem>
              <SelectItem value="KNOCKOUT">Knockout</SelectItem>
              <SelectItem value="GROUP_KNOCKOUT">Group + Knockout</SelectItem>
            </SelectContent>
          </Select>
          {errors.format && <p className="text-xs text-destructive">{errors.format.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Max Teams *</Label>
          <Input type="number" min={2} max={128} placeholder="16" {...register('maxTeams')} />
          {errors.maxTeams && <p className="text-xs text-destructive">{errors.maxTeams.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Start Date *</Label>
          <Input type="date" {...register('startDate')} />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>End Date *</Label>
          <Input type="date" {...register('endDate')} />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Venue</Label>
        <Input placeholder="e.g. City Stadium" {...register('venue')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Match Duration (min)</Label>
          <Input type="number" min={1} {...register('matchTime')} />
        </div>
        <div className="space-y-1.5">
          <Label>Playing Members</Label>
          <Input type="number" min={1} max={11} {...register('playingMembers')} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Substitutes</Label>
          <Input type="number" min={0} max={11} {...register('maxSubstitutes')} />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Next: Select Teams →
      </Button>
    </form>
  )
}
