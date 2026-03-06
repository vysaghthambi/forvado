import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Coordinator Panel — Forvado' }

export default async function CoordinatorPage() {
  const user = await requireUser()

  if (user.role !== 'COORDINATOR' && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Coordinator Panel</h1>
      <p className="text-muted-foreground text-sm">
        Match control panels for your assigned tournaments will appear here.
      </p>
    </div>
  )
}
