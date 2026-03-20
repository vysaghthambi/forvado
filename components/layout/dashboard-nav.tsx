'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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

// ── Wireframe-style SVG icons ─────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconTournaments() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 3h10l2 6H5L7 3z"/><path d="M5 9c0 3.866 3.134 7 7 7s7-3.134 7-7"/>
    </svg>
  )
}
function IconTeams() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <circle cx="17" cy="8" r="2"/><path d="M21 20v-1a3 3 0 00-2-2.83"/>
    </svg>
  )
}
function IconAdmin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}
function IconCoordinator() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )
}

const NAV_TABS = [
  { href: '/dashboard', label: 'Dashboard', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'], Icon: IconDashboard },
  { href: '/tournaments', label: 'Tournaments', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'], Icon: IconTournaments },
  { href: '/teams', label: 'Teams', roles: ['PLAYER', 'TEAM_OWNER', 'COORDINATOR', 'ADMIN'], Icon: IconTeams },
  { href: '/admin', label: 'Admin', roles: ['ADMIN'], Icon: IconAdmin },
  { href: '/coordinator', label: 'Coordinator', roles: ['COORDINATOR', 'ADMIN'], Icon: IconCoordinator },
]

export function DashboardNav({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [meOpen, setMeOpen] = useState(false)

  const visibleTabs = NAV_TABS.filter((t) => t.roles.includes(user.role))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const initials = user.displayName.charAt(0).toUpperCase()

  const isMeActive = meOpen || pathname === '/profile' || pathname.startsWith('/admin') || pathname.startsWith('/coordinator')

  return (
    <>
      {/* ── Desktop / Tablet Header ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex h-[54px] items-center gap-0 border-b px-5 flex-shrink-0"
        style={{ background: 'var(--sidebar, #0f1018)', borderColor: 'var(--border, #232638)' }}
      >
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-[9px] mr-7 flex-shrink-0 no-underline">
          {/* Brand mark — accent box with star */}
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[8px] flex-shrink-0"
            style={{ background: 'var(--primary, #f5c842)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polygon
                points="12,4 14.4,10.4 21.2,10.4 15.8,14.2 18,20.4 12,16.6 6,20.4 8.2,14.2 2.8,10.4 9.6,10.4"
                fill="#000"
              />
            </svg>
          </div>
          {/* Brand name */}
          <span
            className="text-[20px] font-bold tracking-[0.3px] leading-none"
            style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', color: 'var(--foreground)' }}
          >
            For<em className="not-italic" style={{ color: 'var(--primary)' }}>vado</em>
          </span>
        </Link>

        {/* Nav tabs — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-[2px]">
          {visibleTabs.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-[7px] rounded-[8px] px-[13px] py-[7px] text-[13px] no-underline transition-all duration-200"
                style={
                  active
                    ? { background: 'var(--accent-dim)', color: 'var(--accent-clr)', fontWeight: 600 }
                    : { color: 'var(--text2)', fontWeight: 400 }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg3)'
                    e.currentTarget.style.color = 'var(--text)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text2)'
                  }
                }}
              >
                <span
                  style={{
                    stroke: active ? 'var(--accent-clr)' : 'var(--muted-clr)',
                    display: 'flex',
                    transition: 'var(--tr)',
                  }}
                >
                  <Icon />
                </span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notification bell — keeps all existing realtime functionality */}
          <NotificationBell userId={user.id} />

          {/* Avatar + profile dropdown — desktop only */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200 outline-none"
                  style={{
                    background: 'var(--accent-dim)',
                    border: '1.5px solid var(--border2)',
                    color: 'var(--accent-clr)',
                    fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-clr)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)' }}
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif' }}>
                    {user.displayName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {user.role.toLowerCase().replace('_', ' ')}
                  </p>
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
        </div>
      </header>

      {/* ── Mobile Bottom Navigation ───────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t safe-area-inset-bottom"
        style={{ background: 'var(--sidebar, #0f1018)', borderColor: 'var(--border, #232638)' }}
      >
        <div className="flex h-16 items-stretch">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 transition-colors no-underline"
            style={{ color: isActive('/dashboard') ? 'var(--primary)' : 'var(--muted-foreground)' }}
          >
            <div
              className="rounded-2xl px-4 py-1"
              style={isActive('/dashboard') ? { background: 'rgba(245,200,66,.12)' } : undefined}
            >
              <Home className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Tournaments */}
          <Link
            href="/tournaments"
            className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 transition-colors no-underline"
            style={{ color: isActive('/tournaments') ? 'var(--primary)' : 'var(--muted-foreground)' }}
          >
            <div
              className="rounded-2xl px-4 py-1"
              style={isActive('/tournaments') ? { background: 'rgba(245,200,66,.12)' } : undefined}
            >
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Tournaments</span>
          </Link>

          {/* Teams */}
          <Link
            href="/teams"
            className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 transition-colors no-underline"
            style={{ color: isActive('/teams') ? 'var(--primary)' : 'var(--muted-foreground)' }}
          >
            <div
              className="rounded-2xl px-4 py-1"
              style={isActive('/teams') ? { background: 'rgba(245,200,66,.12)' } : undefined}
            >
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Teams</span>
          </Link>

          {/* Me */}
          <button
            onClick={() => setMeOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 transition-colors"
            style={{ color: isMeActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
          >
            <div
              className="rounded-2xl px-4 py-1"
              style={isMeActive ? { background: 'rgba(245,200,66,.12)' } : undefined}
            >
              <User className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Me</span>
          </button>
        </div>
      </nav>

      {/* ── Me Sheet (mobile) ─────────────────────────────────────────────── */}
      <Sheet open={meOpen} onOpenChange={setMeOpen}>
        <SheetContent
          side="bottom"
          className="h-auto rounded-t-2xl pb-8 px-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-3 pb-4 mb-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold flex-shrink-0"
              style={{
                background: 'rgba(245,200,66,.12)',
                borderColor: 'var(--border)',
                color: 'var(--primary)',
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              }}
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold">{user.displayName}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              href="/profile"
              onClick={() => setMeOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors no-underline"
              style={{ color: 'var(--foreground)' }}
            >
              <User className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              View Profile
            </Link>

            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMeOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors no-underline"
                style={{ color: 'var(--foreground)' }}
              >
                <ShieldCheck className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                Admin Panel
              </Link>
            )}

            {['COORDINATOR', 'ADMIN'].includes(user.role) && (
              <Link
                href="/coordinator"
                onClick={() => setMeOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors no-underline"
                style={{ color: 'var(--foreground)' }}
              >
                <ClipboardList className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                Coordinator
              </Link>
            )}

            <button
              onClick={() => { setMeOpen(false); handleSignOut() }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-left transition-colors"
              style={{ color: 'var(--destructive)' }}
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
