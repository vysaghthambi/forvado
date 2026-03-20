import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateTournamentForm } from '@/components/tournaments/create-tournament-form'
import Link from 'next/link'

export const metadata = { title: 'New Tournament — Forvado' }

export default async function NewTournamentPage() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') redirect('/tournaments')

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-clr)' }}>
        <Link href="/tournaments" className="no-underline transition-colors hover:text-foreground" style={{ color: 'var(--muted-clr)' }}>
          Tournaments
        </Link>
        <span style={{ color: 'var(--border2)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>Create Tournament</span>
      </div>

      {/* Page head */}
      <div>
        <h1 style={{
          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0,
        }}>
          Create Tournament
        </h1>
        <p style={{ fontSize: 12, color: 'var(--muted-clr)', marginTop: 3 }}>
          Set up a new tournament in two steps.
        </p>
      </div>

      <CreateTournamentForm />
    </div>
  )
}
