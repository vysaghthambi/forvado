'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(60, 'Max 60 characters'),
  description: z.string().max(500).optional(),
  homeColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour').optional().or(z.literal('')),
  awayColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour').optional().or(z.literal('')),
  badgeUrl: z.string().optional(),
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
  const [badgePreview, setBadgePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', homeColour: '#1a3a7a', awayColour: '#ffffff', isAcceptingRequests: true },
  })

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form

  const teamName = watch('name')
  const homeColour = watch('homeColour') || '#1a3a7a'
  const isAccepting = watch('isAcceptingRequests')

  // Derive foreground colour from preset, or fall back to white
  const preset = COLOUR_PRESETS.find(([bg]) => bg === homeColour)
  const fgColour = preset ? preset[1] : '#ffffff'
  const initials = teamName
    ? teamName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'TM'

  async function handleBadgeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Badge must be under 2MB'); return }

    setUploading(true)
    const fileName = `badge-${Date.now()}.${file.name.split('.').pop()}`
    const { data, error } = await supabase.storage.from('team-badges').upload(fileName, file, { upsert: true })

    if (error || !data) { toast.error('Upload failed'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('team-badges').getPublicUrl(data.path)
    setValue('badgeUrl', urlData.publicUrl)
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
              {badgePreview ? (
                <img src={badgePreview} alt="badge" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 12 }} />
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                    fontSize: 36, fontWeight: 800, color: fgColour, letterSpacing: 2,
                    lineHeight: 1,
                  }}>
                    {initials}
                  </div>
                  {teamName && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: fgColour, opacity: 0.8 }}>
                      {teamName}
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormGroup>

          {/* Home colour swatches */}
          <FormGroup>
            <label style={labelStyle}>Home Colour</label>
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

          {/* Away colour */}
          <FormGroup>
            <label style={labelStyle}>Away Colour</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={watch('awayColour') || '#ffffff'}
                onChange={(e) => setValue('awayColour', e.target.value)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: '1px solid var(--border2)', cursor: 'pointer',
                  padding: 3, background: 'var(--bg2)',
                }}
              />
              <input
                style={{ ...inputStyle, maxWidth: 140 }}
                placeholder="#ffffff"
                {...register('awayColour')}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-clr)')}
                onBlur={(e) => (e.target.style.borderColor = errors.awayColour ? 'var(--live)' : 'var(--border2)')}
              />
            </div>
            <ErrorMsg msg={errors.awayColour?.message} />
          </FormGroup>

          {/* Name + Badge upload row */}
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
              <label style={labelStyle}>Badge Image</label>
              <label
                htmlFor="badge-upload"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 7, height: 38, borderRadius: 8,
                  border: '1px dashed var(--border2)',
                  background: 'var(--bg2)',
                  fontSize: 12, fontWeight: 500,
                  color: uploading ? 'var(--muted-clr)' : 'var(--text2)',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'border-color .15s',
                  boxSizing: 'border-box', width: '100%',
                }}
                onMouseEnter={(e) => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-clr)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)' }}
              >
                {uploading ? 'Uploading…' : badgePreview ? '✓ Uploaded' : '↑ Upload badge'}
              </label>
              <input id="badge-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBadgeUpload} disabled={uploading} />
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

          {/* Accept join requests */}
          <label
            htmlFor="accepting"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 9,
              border: `1px solid ${isAccepting ? 'var(--accent-clr)' : 'var(--border)'}`,
              background: isAccepting ? 'var(--accent-dim)' : 'var(--bg2)',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            <div
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `1.5px solid ${isAccepting ? 'var(--accent-clr)' : 'var(--border2)'}`,
                background: isAccepting ? 'var(--accent-clr)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#000',
                transition: 'all .15s',
              }}
            >
              {isAccepting && '✓'}
            </div>
            <input
              type="checkbox"
              id="accepting"
              checked={isAccepting ?? true}
              onChange={(e) => setValue('isAcceptingRequests', e.target.checked)}
              style={{ display: 'none' }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                Accept join requests from players
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-clr)', marginTop: 2 }}>
                Players can request to join this team
              </div>
            </div>
          </label>

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
