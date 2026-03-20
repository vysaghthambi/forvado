'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
        <button
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border-0 bg-transparent transition-colors duration-200 outline-none"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--secondary)'
            e.currentTarget.style.color = 'var(--foreground)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--muted-foreground)'
          }}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              className="absolute top-[5px] right-[5px] h-[7px] w-[7px] rounded-full"
              style={{ background: 'var(--destructive)', border: '1.5px solid var(--sidebar, #0f1018)' }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[272px] p-0 overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-[15px] py-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <span
            className="text-[13px] font-bold tracking-[0.3px]"
            style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif' }}
          >
            Notifications
          </span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] bg-transparent border-0 cursor-pointer"
              style={{ color: 'var(--primary)' }}
            >
              Clear all
            </button>
          )}
        </div>

        <ScrollArea className="max-h-[340px]">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
              No notifications yet.
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="w-full text-left flex gap-[9px] items-start border-b last:border-0 transition-colors"
                  style={{
                    padding: '10px 15px',
                    borderColor: 'rgba(35,38,56,.5)',
                    background: !n.read ? 'rgba(245,200,66,.04)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.025)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = !n.read ? 'rgba(245,200,66,.04)' : 'transparent' }}
                >
                  <div
                    className="h-[6px] w-[6px] rounded-full flex-shrink-0 mt-1"
                    style={{ background: !n.read ? 'var(--primary)' : 'var(--border)' }}
                  />
                  <div className="min-w-0">
                    <span className="block text-[11px] leading-[1.5]" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>{n.title}</span>
                      {' '}{n.body}
                    </span>
                    <span className="block text-[10px] mt-[2px]" style={{ color: 'var(--muted-foreground)' }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-[15px] py-2" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/notifications"
            className="text-[11px] no-underline transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
