'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(60, 'Max 60 characters'),
  description: z.string().max(500).optional(),
  homeColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour').optional().or(z.literal('')),
  shortCode: z.string().min(2).max(3).regex(/^[A-Z]+$/, 'Must be 2-3 uppercase letters').optional().or(z.literal('')),
  isAcceptingRequests: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

// Preset colour pairs: [bgDark, fgBright]
const COLOUR_PRESETS: [string, string][] = [
  ['#1a3a7a', '#7ab4ff'],
  ['#7a1a1a', '#ff7a7a'],
  ['#1a5c1a', '#2ddb7f'],
  ['#5c3d00', '#f5c842'],
  ['#3d1a5c', '#c87aff'],
  ['#1a4a5c', '#2ddbbe'],
  ['#5c1a3d', '#ff7ab4'],
  ['#2a2a2a', '#b0b0b0'],
]

const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--muted-clr)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

function FormGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</div>
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <span style={{ fontSize: 11, color: 'var(--live)', marginTop: 2 }}>{msg}</span>
}

export function CreateTeamForm() {
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', homeColour: '#1a3a7a', shortCode: '', isAcceptingRequests: true },
  })

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form

  const teamName = watch('name')
  const homeColour = watch('homeColour') || '#1a3a7a'

  // Derive foreground colour from preset, or fall back to white
  const preset = COLOUR_PRESETS.find(([bg]) => bg === homeColour)
  const fgColour = preset ? preset[1] : '#ffffff'
  const initials = teamName
    ? teamName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'TM'

  async function onSubmit(values: FormValues) {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        homeColour: values.homeColour || null,
        shortCode: values.shortCode || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create team'); return }
    toast.success('Team created!')
    router.push(`/teams/${data.team.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
            textTransform: 'uppercase', color: 'var(--text2)',
          }}>
            Team Identity
          </span>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Banner preview */}
          <FormGroup>
            <label style={labelStyle}>Team Banner</label>
            <div style={{
              width: '100%', height: 120,
              borderRadius: 12, overflow: 'hidden',
              background: homeColour,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              border: `1px solid ${homeColour}66`,
            }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                  fontSize: 36, fontWeight: 800, color: fgColour, letterSpacing: 2,
                  lineHeight: 1,
                }}>
                  {watch('shortCode') || initials}
                </div>
                {teamName && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: fgColour, opacity: 0.8 }}>
                    {teamName}
                  </div>
                )}
              </div>
            </div>
          </FormGroup>

          {/* Team colour swatches */}
          <FormGroup>
            <label style={labelStyle}>Team Colour</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {COLOUR_PRESETS.map(([bg]) => {
                const isSelected = homeColour === bg
                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setValue('homeColour', bg)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                      background: bg, border: isSelected ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: isSelected ? '0 0 0 2px var(--border2)' : 'none',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all .15s', flexShrink: 0, outline: 'none',
                    }}
                  />
                )
              })}
              {/* Custom colour picker */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <input
                  type="color"
                  value={homeColour}
                  onChange={(e) => setValue('homeColour', e.target.value)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '2px solid var(--border2)',
                    cursor: 'pointer', padding: 2, background: 'transparent',
                  }}
                  title="Custom colour"
                />
              </div>
              <input type="hidden" {...register('homeColour')} />
            </div>
            <ErrorMsg msg={errors.homeColour?.message} />
          </FormGroup>

          {/* Name + Short Code row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormGroup>
              <label style={labelStyle}>Team Name *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Phoenix FC"
                {...register('name')}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                onBlur={(e) => (e.target.style.borderColor = errors.name ? 'var(--live)' : 'var(--border2)')}
              />
              <ErrorMsg msg={errors.name?.message} />
            </FormGroup>

            <FormGroup>
              <label style={labelStyle}>Short Code *</label>
              <input
                style={{ ...inputStyle, textTransform: 'uppercase' }}
                placeholder="e.g. FCB"
                maxLength={3}
                {...register('shortCode')}
                onChange={(e) => setValue('shortCode', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                onBlur={(e) => (e.target.style.borderColor = errors.shortCode ? 'var(--live)' : 'var(--border2)')}
              />
              <ErrorMsg msg={errors.shortCode?.message} />
            </FormGroup>
          </div>

          {/* Description */}
          <FormGroup>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              placeholder="Brief description of your team…"
              rows={3}
              {...register('description')}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
            />
            <ErrorMsg msg={errors.description?.message} />
          </FormGroup>

        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Link
          href="/teams"
          className="no-underline"
          style={{
            padding: '8px 18px', borderRadius: 8,
            border: '1px solid var(--border2)', background: 'transparent',
            fontSize: 13, fontWeight: 500, color: 'var(--text2)',
          }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 22px', borderRadius: 9,
            background: isSubmitting ? 'var(--bg3)' : 'var(--accent-clr)',
            color: isSubmitting ? 'var(--muted-clr)' : '#000',
            fontSize: 13, fontWeight: 600, border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
          }}
        >
          {isSubmitting ? 'Creating…' : 'Create Team'}
        </button>
      </div>
    </form>
  )
}
