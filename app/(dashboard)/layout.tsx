import { requireUser } from '@/lib/auth'
import { DashboardNav } from '@/components/layout/dashboard-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 pt-6 pb-24 md:pb-8">{children}</main>
    </div>
  )
}
