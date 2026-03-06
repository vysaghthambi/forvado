'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(60, 'Max 60 characters'),
  description: z.string().max(500).optional(),
  homeColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour').optional().or(z.literal('')),
  awayColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour').optional().or(z.literal('')),
  badgeUrl: z.string().optional(),
  isAcceptingRequests: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export function CreateTeamForm() {
  const router = useRouter()
  const [badgePreview, setBadgePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', homeColour: '#16a34a', awayColour: '#ffffff', isAcceptingRequests: true },
  })

  async function handleBadgeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Badge must be under 2MB'); return }

    setUploading(true)
    const fileName = `badge-${Date.now()}.${file.name.split('.').pop()}`
    const { data, error } = await supabase.storage.from('team-badges').upload(fileName, file, { upsert: true })

    if (error || !data) { toast.error('Upload failed'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('team-badges').getPublicUrl(data.path)
    form.setValue('badgeUrl', urlData.publicUrl)
    setBadgePreview(urlData.publicUrl)
    setUploading(false)
  }

  async function onSubmit(values: FormValues) {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        homeColour: values.homeColour || null,
        awayColour: values.awayColour || null,
        badgeUrl: values.badgeUrl || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create team'); return }

    toast.success('Team created!')
    router.push(`/teams/${data.team.id}`)
    router.refresh()
  }

  const teamName = form.watch('name')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Badge */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarImage src={badgePreview ?? ''} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
              {teamName?.slice(0, 2).toUpperCase() || 'TM'}
            </AvatarFallback>
          </Avatar>
          <label htmlFor="badge-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
            {uploading ? 'Uploading…' : 'Upload badge'}
          </label>
          <input id="badge-upload" type="file" accept="image/*" className="hidden" onChange={handleBadgeUpload} disabled={uploading} />
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Team Name</FormLabel>
            <FormControl><Input placeholder="e.g. Red Lions FC" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl><Textarea placeholder="A short description of your team…" rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="homeColour" render={({ field }) => (
            <FormItem>
              <FormLabel>Home Colour</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <input type="color" value={field.value || '#16a34a'} onChange={e => field.onChange(e.target.value)} className="h-9 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5" />
                  <Input placeholder="#16a34a" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="awayColour" render={({ field }) => (
            <FormItem>
              <FormLabel>Away Colour</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <input type="color" value={field.value || '#ffffff'} onChange={e => field.onChange(e.target.value)} className="h-9 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5" />
                  <Input placeholder="#ffffff" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
          <input
            type="checkbox"
            id="accepting"
            checked={form.watch('isAcceptingRequests')}
            onChange={e => form.setValue('isAcceptingRequests', e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <label htmlFor="accepting" className="text-sm cursor-pointer">
            Accept join requests from players
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating…' : 'Create Team'}
        </Button>
      </form>
    </Form>
  )
}
