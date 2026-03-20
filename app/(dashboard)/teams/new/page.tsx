import { requireUser } from '@/lib/auth'
import { CreateTeamForm } from '@/components/teams/create-team-form'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Create Team — Forvado' }

export default async function NewTeamPage() {
  const user = await requireUser()
  if (user.role !== 'ADMIN' && user.role !== 'TEAM_OWNER') redirect('/teams')

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-clr)' }}>
        <Link href="/teams" className="no-underline transition-colors hover:text-foreground" style={{ color: 'var(--muted-clr)' }}>
          Teams
        </Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>Create Team</span>
      </div>

      {/* Page head */}
      <div>
        <h1 style={{
          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0,
        }}>
          Create Team
        </h1>
        <p style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 3 }}>
          Set up your team profile, banner and home colour.
        </p>
      </div>

      <CreateTeamForm />
    </div>
  )
}
