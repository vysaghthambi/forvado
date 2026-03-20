import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminUsersTable } from '@/components/admin/admin-users-table'
import Link from 'next/link'

export const metadata = { title: 'Admin Panel — Forvado' }

export default async function AdminPage() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') redirect('/dashboard')

  const [totalUsers, adminCount, ownerCount, playerCount, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'TEAM_OWNER' } }),
    prisma.user.count({ where: { role: 'PLAYER' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        profileComplete: true,
        createdAt: true,
        _count: { select: { teamMemberships: true } },
      },
    }),
  ])

  const kpis = [
    { label: 'Total Users', value: totalUsers, sub: 'Across all roles', accent: 'var(--accent-clr)', border: 'var(--accent-dim)' },
    { label: 'Admins', value: adminCount, sub: 'Full platform access', accent: 'var(--blue)', border: 'var(--blue-dim)' },
    { label: 'Team Owners', value: ownerCount, sub: 'Own and manage teams', accent: 'var(--green)', border: 'var(--green-dim)' },
    { label: 'Players', value: playerCount, sub: 'Active participants', accent: 'var(--muted-clr)', border: 'var(--border)' },
  ]

  // Serialize dates for client component
  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1080, margin: '0 auto' }}>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
            fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0,
          }}>
            Admin Panel
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 3 }}>
            Manage all users and their roles across the platform.
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {kpis.map(({ label, value, sub, accent, border }) => (
          <div
            key={label}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16,
              position: 'relative', overflow: 'hidden',
              transition: 'border-color .15s, transform .15s',
            }}
            className="hover:border-border2 hover:-translate-y-px"
          >
            {/* Top accent strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />

            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted-clr)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
              {label}
            </div>
            <div style={{
              fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
              fontSize: 30, fontWeight: 700, lineHeight: 1, color: 'var(--text)',
            }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-clr)', marginTop: 6 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <AdminUsersTable initialUsers={serializedUsers} currentUserId={user.id} />
    </div>
  )
}
