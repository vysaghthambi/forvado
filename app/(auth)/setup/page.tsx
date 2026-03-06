import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { SetupWizard } from '@/components/setup/setup-wizard'

export const metadata = {
  title: 'Complete Your Profile — Forvado',
}

export default async function SetupPage() {
  const user = await requireAuth()

  // If already completed, redirect to dashboard
  if (user?.profileComplete) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Forvado</h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s set up your player profile before you get started.
          </p>
        </div>
        <SetupWizard />
      </div>
    </main>
  )
}
