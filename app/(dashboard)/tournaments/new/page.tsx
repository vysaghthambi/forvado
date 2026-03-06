import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateTournamentForm } from '@/components/tournaments/create-tournament-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'New Tournament — Forvado' }

export default async function NewTournamentPage() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') redirect('/tournaments')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/tournaments"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">New Tournament</h1>
          <p className="text-sm text-muted-foreground">Set up a new football tournament</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <CreateTournamentForm />
      </div>
    </div>
  )
}
