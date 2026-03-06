'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserMinus } from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  userId: string
  role: string
  jerseyNumber: number | null
  user: { id: string; displayName: string; avatarUrl: string | null; position: string | null }
}

const ROLE_LABELS: Record<string, string> = { CAPTAIN: 'Captain', VICE_CAPTAIN: 'Vice Captain', PLAYER: 'Player' }
const POSITION_LABELS: Record<string, string> = { GK: 'GK', DEF: 'DEF', MID: 'MID', FWD: 'FWD' }

interface Props {
  teamId: string
  members: Member[]
  isOwner: boolean
  ownerId: string
}

export function TeamRoster({ teamId, members, isOwner, ownerId }: Props) {
  const router = useRouter()

  async function removeMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to remove member'); return }
    toast.success(`${name} removed`)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="hidden sm:table-cell">Position</TableHead>
            <TableHead className="hidden sm:table-cell">Role</TableHead>
            {isOwner && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.userId} className="border-border/50 hover:bg-muted/20">
              <TableCell className="text-center font-mono text-muted-foreground text-sm">
                {m.jerseyNumber ?? '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.user.avatarUrl ?? ''} />
                    <AvatarFallback className="text-xs">{m.user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{m.user.displayName}</span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {m.user.position ? (
                  <Badge variant="outline" className="text-xs border-border/60">
                    {POSITION_LABELS[m.user.position]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className="text-sm text-muted-foreground">{ROLE_LABELS[m.role]}</span>
              </TableCell>
              {isOwner && (
                <TableCell>
                  {m.userId !== ownerId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMember(m.userId, m.user.displayName)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={isOwner ? 5 : 4} className="py-8 text-center text-muted-foreground text-sm">
                No members yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
