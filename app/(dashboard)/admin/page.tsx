import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Admin Panel — Forvado' }

export default async function AdminPage() {
  const user = await requireUser()

  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="text-muted-foreground text-sm">
        Tournament management, user roles, and system settings will appear here.
      </p>
    </div>
  )
}
