'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const STEPS = ['Profile', 'Position', 'Confirm'] as const

// Use string-based schema so RHF input values stay as strings through the form
const schema = z.object({
  displayName: z.string().min(2, 'Minimum 2 characters').max(50, 'Maximum 50 characters'),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD'], { error: 'Select a position' }),
  jerseyNumber: z
    .string()
    .min(1, 'Required')
    .refine((v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) >= 1 && parseInt(v, 10) <= 99, {
      message: 'Must be between 1 and 99',
    }),
  dateOfBirth: z.string().optional(),
  avatarUrl: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
}

export function SetupWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      jerseyNumber: '',
      dateOfBirth: '',
      avatarUrl: '',
    },
    mode: 'onTouched',
  })

  const supabase = createClient()

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      form.setError('avatarUrl', { message: 'Image must be under 2MB' })
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `avatar-${Date.now()}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError || !data) {
      form.setError('avatarUrl', { message: 'Upload failed. Try again.' })
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
    form.setValue('avatarUrl', urlData.publicUrl)
    setAvatarPreview(urlData.publicUrl)
    setUploading(false)
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/users/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: values.displayName,
        position: values.position,
        jerseyNumber: parseInt(values.jerseyNumber, 10),
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
        avatarUrl: values.avatarUrl || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    router.push('/dashboard')
  }

  async function nextStep() {
    const fieldsPerStep: Array<(keyof FormValues)[]> = [
      ['displayName', 'dateOfBirth'],
      ['position', 'jerseyNumber'],
      [],
    ]

    const valid = await form.trigger(fieldsPerStep[step])
    if (!valid) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const progressValue = ((step + 1) / STEPS.length) * 100
  const displayName = form.watch('displayName')

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'text-foreground font-medium' : ''}>
              {s}
            </span>
          ))}
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Step 0: Profile */}
          {step === 0 && (
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview ?? ''} alt="Avatar preview" />
                  <AvatarFallback className="text-lg">
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer text-sm font-medium text-primary hover:underline"
                >
                  {uploading ? 'Uploading…' : 'Upload photo'}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={() => (
                    <FormItem className="hidden">
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cristiano R." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 1: Position & Jersey */}
          {step === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(POSITION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jerseyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jersey Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 10"
                        min={1}
                        max={99}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-medium">Review your profile</h3>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={avatarPreview ?? ''} />
                  <AvatarFallback>{form.getValues('displayName')?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium">{form.getValues('displayName')}</p>
                  <p className="text-muted-foreground">
                    #{form.getValues('jerseyNumber')} ·{' '}
                    {POSITION_LABELS[form.getValues('position')]}
                  </p>
                  {form.getValues('dateOfBirth') && (
                    <p className="text-muted-foreground">
                      {new Date(form.getValues('dateOfBirth')!).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" className="flex-1" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Saving…' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
