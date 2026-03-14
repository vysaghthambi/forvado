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
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Home, Trophy, Users, User, ShieldCheck, ClipboardList, LogOut } from 'lucide-react'
import type { User as PrismaUser } from '@prisma/client'

interface Props {
  user: PrismaUser
}

const DESKTOP_LINKS = [
  { href: '/dashboard', label: 'Dashboard', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'] },
  { href: '/tournaments', label: 'Tournaments', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'] },
  { href: '/teams', label: 'Teams', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'] },
  { href: '/admin', label: 'Admin', roles: ['ADMIN'] },
  { href: '/coordinator', label: 'Coordinator', roles: ['COORDINATOR', 'ADMIN'] },
]

function BottomTab({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <div className={`rounded-2xl px-4 py-1 ${active ? 'bg-primary/15' : ''}`}>{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

export function DashboardNav({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [meOpen, setMeOpen] = useState(false)

  const visibleLinks = DESKTOP_LINKS.filter((l) => l.roles.includes(user.role))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const isMeActive =
    meOpen ||
    pathname === '/profile' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/coordinator')

  const initials = user.displayName.charAt(0).toUpperCase()

  return (
    <>
      {/* ── Top Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Logo + Desktop nav */}
          <div className="flex h-full items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-base font-bold tracking-tight"
            >
              <span className="text-xl leading-none">⚽</span>
              <span className="text-primary">Forvado</span>
            </Link>

            {/* Desktop nav links with underline accent */}
            <nav className="hidden h-full items-center gap-0.5 md:flex">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex h-full items-center px-3 text-sm transition-colors ${
                    isActive(link.href)
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <NotificationBell userId={user.id} />

            {/* Desktop avatar dropdown */}
            <div className="hidden md:block ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl ?? ''} alt={user.displayName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role.toLowerCase().replace('_', ' ')}
                    </p>
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
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar ────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 safe-area-inset-bottom">
        <div className="flex h-16 items-stretch">
          <BottomTab
            href="/dashboard"
            label="Home"
            icon={<Home className="h-5 w-5" />}
            active={isActive('/dashboard')}
          />
          <BottomTab
            href="/tournaments"
            label="Tournaments"
            icon={<Trophy className="h-5 w-5" />}
            active={isActive('/tournaments')}
          />
          <BottomTab
            href="/teams"
            label="Teams"
            icon={<Users className="h-5 w-5" />}
            active={isActive('/teams')}
          />
          {/* Me tab */}
          <button
            onClick={() => setMeOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 transition-colors ${
              isMeActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className={`rounded-2xl px-4 py-1 ${isMeActive ? 'bg-primary/15' : ''}`}>
              <User className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Me</span>
          </button>
        </div>
      </nav>

      {/* ── Me Sheet (slides up from bottom) ─────────────────── */}
      <Sheet open={meOpen} onOpenChange={setMeOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl pb-8 px-4">
          {/* User info */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/50">
            <Avatar className="h-11 w-11">
              <AvatarImage src={user.avatarUrl ?? ''} alt={user.displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{user.displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-1">
            <Link
              href="/profile"
              onClick={() => setMeOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              View Profile
            </Link>

            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMeOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Admin Panel
              </Link>
            )}

            {['COORDINATOR', 'ADMIN'].includes(user.role) && (
              <Link
                href="/coordinator"
                onClick={() => setMeOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
              >
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Coordinator
              </Link>
            )}

            <button
              onClick={() => {
                setMeOpen(false)
                handleSignOut()
              }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
