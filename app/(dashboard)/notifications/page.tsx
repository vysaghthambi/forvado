import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Notifications — Forvado' }

export default async function NotificationsPage() {
  const user = await requireUser()

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">You have no notifications yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
          {notifications.map((n) => (
            <div key={n.id} className={cn('px-5 py-4 transition-colors', !n.read && 'bg-primary/5')}>
              <div className="flex items-start gap-3">
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                <div className={cn('min-w-0', n.read && 'pl-5')}>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground/50">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
