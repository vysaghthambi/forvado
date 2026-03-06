'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'

interface User {
  id: string
  displayName: string
  avatarUrl: string | null
  position: string | null
  jerseyNumber: number | null
}

const POSITION_LABELS: Record<string, string> = { GK: 'GK', DEF: 'DEF', MID: 'MID', FWD: 'FWD' }

export function InvitePlayerDialog({ teamId }: { teamId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 350)

  async function search(q: string) {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data.users ?? [])
    setSearching(false)
  }

  useEffect(() => { search(debouncedQuery) }, [debouncedQuery])

  async function invite(userId: string) {
    setInviting(userId)
    const res = await fetch(`/api/teams/${teamId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to send invitation')
    } else {
      toast.success('Invitation sent!')
      setOpen(false)
      router.refresh()
    }
    setInviting(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Player
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Invite a Player</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-72">
            {searching && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}
            {!searching && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>No players found.</CommandEmpty>
            )}
            {!searching && results.map((u) => (
              <CommandItem
                key={u.id}
                value={u.id}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                onSelect={() => invite(u.id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.avatarUrl ?? ''} />
                  <AvatarFallback className="text-xs">{u.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.displayName}</p>
                  {u.jerseyNumber && <p className="text-xs text-muted-foreground">#{u.jerseyNumber}</p>}
                </div>
                {u.position && (
                  <Badge variant="secondary" className="text-xs">{POSITION_LABELS[u.position]}</Badge>
                )}
                {inviting === u.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
