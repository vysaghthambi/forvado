'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Eye, EyeOff } from 'lucide-react'

interface Coordinator {
  id: string
  user: { id: string; displayName: string; avatarUrl: string | null; email: string }
}

interface Group {
  id: string
  name: string
  teams: { team: { id: string; name: string } }[]
}

interface RegisteredTeam {
  team: { id: string; name: string; badgeUrl: string | null }
  group?: { id: string; name: string } | null
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REGISTRATION', label: 'Registration' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
]

interface Props {
  tournamentId: string
  status: string
  isPublished: boolean
  coordinators: Coordinator[]
  groups: Group[]
  teams: RegisteredTeam[]
  isAdmin: boolean
}

export function TournamentAdminPanel({ tournamentId, status, isPublished, coordinators, groups, teams, isAdmin }: Props) {
  const router = useRouter()
  const [loadingPublish, setLoadingPublish] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [loadingGroup, setLoadingGroup] = useState(false)
  const [coordinatorUserId, setCoordinatorUserId] = useState('')
  const [loadingCoordinator, setLoadingCoordinator] = useState('')

  async function togglePublish() {
    setLoadingPublish(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/publish`, { method: 'POST' })
    const data = await res.json()
    setLoadingPublish(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success(data.isPublished ? 'Tournament published' : 'Tournament unpublished')
    router.refresh()
  }

  async function changeStatus(newStatus: string) {
    setLoadingStatus(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    setLoadingStatus(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Status updated')
    router.refresh()
  }

  async function createGroup() {
    if (!newGroupName.trim()) return
    setLoadingGroup(true)
    const res = await fetch(`/api/tournaments/${tournamentId}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() }),
    })
    const data = await res.json()
    setLoadingGroup(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success(`Group "${newGroupName}" created`)
    setNewGroupName('')
    router.refresh()
  }

  async function deleteGroup(groupId: string) {
    const res = await fetch(`/api/tournaments/${tournamentId}/groups/${groupId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Group deleted')
    router.refresh()
  }

  async function assignToGroup(teamId: string, gid: string) {
    if (!gid) {
      // Remove from group
      const current = teams.find((t) => t.team.id === teamId)
      if (!current?.group) return
      await fetch(`/api/tournaments/${tournamentId}/groups/${current.group.id}/teams`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
    } else {
      await fetch(`/api/tournaments/${tournamentId}/groups/${gid}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
    }
    router.refresh()
  }

  async function removeCoordinator(userId: string) {
    setLoadingCoordinator(userId)
    const res = await fetch(`/api/tournaments/${tournamentId}/coordinators/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    setLoadingCoordinator('')
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Coordinator removed')
    router.refresh()
  }

  async function addCoordinator() {
    if (!coordinatorUserId.trim()) return
    setLoadingCoordinator('adding')
    const res = await fetch(`/api/tournaments/${tournamentId}/coordinators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: coordinatorUserId.trim() }),
    })
    const data = await res.json()
    setLoadingCoordinator('')
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Coordinator assigned')
    setCoordinatorUserId('')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Status & Publish */}
      {isAdmin && (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Tournament Settings</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={changeStatus} disabled={loadingStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePublish}
              disabled={loadingPublish}
              className="gap-1.5"
            >
              {loadingPublish ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isPublished ? (
                <><EyeOff className="h-3.5 w-3.5" />Unpublish</>
              ) : (
                <><Eye className="h-3.5 w-3.5" />Publish</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Groups</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Group name (e.g. A)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createGroup()}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={createGroup} disabled={loadingGroup || !newGroupName.trim()}>
            {loadingGroup ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">No groups yet.</p>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2">
                <span className="text-sm font-medium">Group {g.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{g.teams.length} team{g.teams.length !== 1 ? 's' : ''}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteGroup(g.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Teams to Groups */}
      {groups.length > 0 && teams.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Assign Teams to Groups</h3>
          <div className="space-y-2">
            {teams.map(({ team, group }) => (
              <div key={team.id} className="flex items-center gap-3">
                <span className="text-sm flex-1 truncate">{team.name}</span>
                <Select value={group?.id ?? ''} onValueChange={(v) => assignToGroup(team.id, v)}>
                  <SelectTrigger className="w-36 h-7 text-xs">
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No group</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>Group {g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coordinators */}
      {isAdmin && (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Coordinators</h3>
          <div className="flex gap-2">
            <Input
              placeholder="User ID to assign as coordinator"
              value={coordinatorUserId}
              onChange={(e) => setCoordinatorUserId(e.target.value)}
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={addCoordinator} disabled={loadingCoordinator === 'adding' || !coordinatorUserId.trim()}>
              {loadingCoordinator === 'adding' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </div>
          {coordinators.length === 0 ? (
            <p className="text-xs text-muted-foreground">No coordinators assigned.</p>
          ) : (
            <div className="space-y-2">
              {coordinators.map(({ user }) => (
                <div key={user.id} className="flex items-center gap-3 rounded-lg border border-border/30 px-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl ?? ''} />
                    <AvatarFallback className="text-xs">{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => removeCoordinator(user.id)}
                    disabled={loadingCoordinator === user.id}
                  >
                    {loadingCoordinator === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
