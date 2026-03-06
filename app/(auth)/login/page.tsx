import { LoginForm } from '@/components/auth/login-form'
import { Suspense } from 'react'

export const metadata = {
  title: 'Sign In — Forvado',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Forvado</h1>
          <p className="text-sm text-muted-foreground">Football Tournament Tracker</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
