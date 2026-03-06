import { requireUser } from '@/lib/auth'
import { CreateTeamForm } from '@/components/teams/create-team-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Create Team — Forvado' }

export default async function NewTeamPage() {
  await requireUser()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/teams"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Create a Team</h1>
          <p className="text-sm text-muted-foreground">Set up your squad and start competing.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <CreateTeamForm />
      </div>
    </div>
  )
}
