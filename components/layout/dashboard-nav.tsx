'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Menu, X } from 'lucide-react'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleLinks = NAV_LINKS.filter((l) => l.roles.includes(user.role))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-base font-bold tracking-tight text-primary">
            Forvado
          </Link>
          {/* Desktop nav */}
          <nav className="hidden gap-4 md:flex">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-foreground ${
                  isActive(link.href) ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell userId={user.id} />

          {/* Desktop avatar dropdown */}
          <div className="hidden md:block">
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
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="flex flex-col h-full">
                {/* User info */}
                <div className="flex items-center gap-3 p-5 border-b border-border/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl ?? ''} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1 flex flex-col gap-1 p-3">
                  {visibleLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive(link.href)
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* Footer actions */}
                <div className="p-3 border-t border-border/50 space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleSignOut() }}
                    className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
