'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications?limit=20')
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications)
    setUnread(data.unreadCount)
  }, [])

  // Initial fetch
  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Supabase Realtime — subscribe to new notifications for this user
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`user:${userId}:notifications`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => { fetchNotifications() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifications])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) markRead(n.id)
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-muted/30 last:border-0',
                    !n.read && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    <div className={cn('min-w-0', n.read && 'pl-3.5')}>
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border/50 px-4 py-2">
          <Link
            href="/notifications"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
