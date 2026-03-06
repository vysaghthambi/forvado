import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Trophy } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  REGISTRATION: 'bg-blue-500/20 text-blue-400',
  UPCOMING: 'bg-amber-500/20 text-amber-400',
  ONGOING: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-muted text-muted-foreground',
}

const FORMAT_LABELS: Record<string, string> = {
  LEAGUE: 'League',
  KNOCKOUT: 'Knockout',
  GROUP_KNOCKOUT: 'Group + Knockout',
}

interface Props {
  tournament: {
    id: string
    name: string
    description?: string | null
    format: string
    status: string
    startDate: string | Date
    endDate: string | Date
    venue?: string | null
    maxTeams: number
    isPublished: boolean
    _count?: { teams: number; matches: number }
  }
}

export function TournamentCard({ tournament: t }: Props) {
  return (
    <Link href={`/tournaments/${t.id}`}>
      <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-border transition-colors h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{t.name}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? 'bg-muted'}`}>
            {t.status.charAt(0) + t.status.slice(1).toLowerCase().replace('_', ' ')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />{FORMAT_LABELS[t.format] ?? t.format}
          </span>
          {t.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />{t.venue}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />{t._count?.teams ?? 0} / {t.maxTeams} teams
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />{format(new Date(t.startDate), 'MMM d, yyyy')}
          </span>
        </div>

        {!t.isPublished && (
          <Badge variant="outline" className="w-fit text-xs border-amber-500/40 text-amber-400">Draft</Badge>
        )}
      </div>
    </Link>
  )
}
