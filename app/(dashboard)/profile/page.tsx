import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EditProfileForm } from '@/components/profile/edit-profile-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Profile — Forvado' }

export default async function ProfilePage() {
  const authUser = await requireUser()
  // Fetch fresh full user record
  const user = await prisma.user.findUnique({ where: { id: authUser.id } })
  if (!user) return null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <EditProfileForm user={user} />
      </div>
    </div>
  )
}
