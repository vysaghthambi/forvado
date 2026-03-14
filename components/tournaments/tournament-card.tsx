import Link from 'next/link'
import { MapPin, Users, Calendar, Trophy } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_LEFT_BORDER: Record<string, string> = {
  DRAFT: 'border-l-muted-foreground/30',
  REGISTRATION: 'border-l-blue-500',
  UPCOMING: 'border-l-amber-500',
  ONGOING: 'border-l-green-500',
  COMPLETED: 'border-l-muted-foreground/30',
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  REGISTRATION: 'bg-blue-500/15 text-blue-400',
  UPCOMING: 'bg-amber-500/15 text-amber-400',
  ONGOING: 'bg-green-500/15 text-green-400',
  COMPLETED: 'bg-muted text-muted-foreground',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  REGISTRATION: 'Upcoming',
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
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
  const isOngoing = t.status === 'ONGOING'

  return (
    <Link href={`/tournaments/${t.id}`} className="block">
      <div
        className={`rounded-xl border border-border/50 border-l-[3px] bg-card px-4 py-4 hover:bg-card/80 transition-colors h-full flex flex-col gap-3 ${
          STATUS_LEFT_BORDER[t.status] ?? 'border-l-muted-foreground/30'
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <Trophy className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{t.name}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{t.description}</p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{FORMAT_LABELS[t.format] ?? t.format}</span>
          {t.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />{t.venue}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />{t._count?.teams ?? 0}/{t.maxTeams}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />{format(new Date(t.startDate), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Footer: status badge */}
        <div className="flex items-center justify-end mt-auto">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[t.status] ?? 'bg-muted'}`}>
            {isOngoing && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
            {STATUS_LABEL[t.status] ?? t.status}
          </span>
        </div>
      </div>
    </Link>
  )
}
