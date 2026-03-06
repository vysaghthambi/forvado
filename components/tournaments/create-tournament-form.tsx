'use client'

import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'

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

export function CreateTournamentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { matchTime: '90', playingMembers: '11', maxSubstitutes: '5' },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const res = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Tournament'}
      </Button>
    </form>
  )
}
