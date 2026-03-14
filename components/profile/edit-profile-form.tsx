'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { User } from '@prisma/client'

interface Props {
  user: User
}

const POSITION_LABELS = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' }
const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Player',
  TEAM_OWNER: 'Team Owner',
  COORDINATOR: 'Tournament Coordinator',
  ADMIN: 'Administrator',
}

export function EditProfileForm({ user }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [position, setPosition] = useState(user.position ?? '')
  const [jerseyNumber, setJerseyNumber] = useState(user.jerseyNumber?.toString() ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(
    user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (displayName.trim().length < 2) { toast.error('Display name must be at least 2 characters'); return }

    setLoading(true)
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: displayName.trim(),
        position: position || null,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
        dateOfBirth: dateOfBirth || null,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to update profile')
      return
    }
    toast.success('Profile updated!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar + Role display */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatarUrl ?? ''} alt={user.displayName} />
          <AvatarFallback className="text-xl">{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user.displayName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Badge variant="secondary" className="mt-1 text-xs">{ROLE_LABELS[user.role] ?? user.role}</Badge>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Display Name *</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Position</Label>
          <Select value={position || 'none'} onValueChange={(v) => setPosition(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {Object.entries(POSITION_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Preferred Jersey #</Label>
          <Input
            type="number"
            min={1}
            max={99}
            placeholder="e.g. 10"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
      </Button>
    </form>
  )
}
