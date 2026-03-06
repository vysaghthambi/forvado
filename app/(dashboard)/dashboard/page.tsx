import { requireUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Dashboard — Forvado' }

const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Player',
  TEAM_OWNER: 'Team Owner',
  COORDINATOR: 'Tournament Coordinator',
  ADMIN: 'Administrator',
}

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
          </div>
          {user.position && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Position</span>
              <span>{user.position}</span>
            </div>
          )}
          {user.jerseyNumber && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Jersey Number</span>
              <span>#{user.jerseyNumber}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
