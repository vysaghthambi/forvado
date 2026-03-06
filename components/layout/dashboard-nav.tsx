'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import type { User } from '@prisma/client'

interface Props {
  user: User
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'] },
  { href: '/tournaments', label: 'Tournaments', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'] },
  { href: '/teams', label: 'Teams', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'] },
  { href: '/admin', label: 'Admin', roles: ['ADMIN'] },
  { href: '/coordinator', label: 'Coordinator', roles: ['COORDINATOR', 'ADMIN'] },
]

export function DashboardNav({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const visibleLinks = NAV_LINKS.filter((l) => l.roles.includes(user.role))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-base font-bold tracking-tight text-primary">
            Forvado
          </Link>
          <nav className="hidden gap-4 md:flex">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-foreground ${pathname.startsWith(link.href)
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell userId={user.id} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl ?? ''} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
