import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_TAG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:        { label: 'Draft',        color: 'var(--muted-clr)',  bg: 'rgba(94,98,128,.15)' },
  REGISTRATION: { label: 'Registration', color: 'var(--blue)',       bg: 'var(--blue-dim)' },
  UPCOMING:     { label: 'Upcoming',     color: 'var(--orange)',     bg: 'var(--orange-dim)' },
  ONGOING:      { label: 'Ongoing',      color: 'var(--accent-clr)', bg: 'var(--accent-dim)' },
  COMPLETED:    { label: 'Completed',    color: 'var(--muted-clr)',  bg: 'rgba(94,98,128,.15)' },
}

const FORMAT_LABELS: Record<string, string> = {
  LEAGUE:         'League',
  KNOCKOUT:       'Knockout',
  GROUP_KNOCKOUT: 'Group + Knockout',
}

interface Props {
  tournament: {
    id: string
    name: string
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
  const tag = STATUS_TAG[t.status]
  const isDraft = t.status === 'DRAFT'
  const isCompleted = t.status === 'COMPLETED'

  const dateRange = (() => {
    const s = new Date(t.startDate)
    const e = new Date(t.endDate)
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
  })()

  return (
    <Link href={`/tournaments/${t.id}`} className="block no-underline group">
      <div
        className="flex flex-col gap-[13px] transition-all duration-200"
        style={{
          background: 'var(--card)',
          border: `1px ${isDraft ? 'dashed' : 'solid'} var(--border)`,
          borderRadius: 12,
          padding: 17,
          opacity: isDraft || isCompleted ? (isDraft ? 0.7 : 0.75) : 1,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'var(--border2)'
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 4px 24px rgba(0,0,0,.5)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'var(--border)'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }}
      >
        {/* Head */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className="truncate"
              style={{
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.2px',
                color: 'var(--text)',
              }}
            >
              {t.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
              {FORMAT_LABELS[t.format] ?? t.format}
              {t._count ? ` · ${t._count.teams}/${t.maxTeams} teams` : ''}
            </div>
          </div>
          {tag && (
            <span
              style={{
                flexShrink: 0,
                padding: '3px 8px',
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 600,
                color: tag.color,
                background: tag.bg,
              }}
            >
              {tag.label}
            </span>
          )}
        </div>

        {/* Draft notice */}
        {isDraft && (
          <div style={{ fontSize: 11, color: 'var(--muted-clr)' }}>
            Setup incomplete — add teams &amp; schedule to publish.
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{ fontSize: 11, color: 'var(--muted-clr)' }}
        >
          <span>{dateRange}</span>
          {t.venue && <span className="truncate ml-2 text-right">{t.venue}</span>}
        </div>
      </div>
    </Link>
  )
}
