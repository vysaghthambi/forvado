/** Shared display labels and tag styles for tournaments and matches. */

export const TOURNAMENT_STATUS_TAG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:        { label: 'Draft',        color: 'var(--muted-clr)',  bg: 'rgba(94,98,128,.15)' },
  REGISTRATION: { label: 'Registration', color: 'var(--blue)',       bg: 'var(--blue-dim)'     },
  UPCOMING:     { label: 'Upcoming',     color: 'var(--orange)',     bg: 'var(--orange-dim)'   },
  ONGOING:      { label: 'Ongoing',      color: 'var(--accent-clr)', bg: 'var(--accent-dim)'   },
  COMPLETED:    { label: 'Completed',    color: 'var(--muted-clr)',  bg: 'rgba(94,98,128,.15)' },
}

export const FORMAT_LABEL: Record<string, string> = {
  LEAGUE:           'League',
  KNOCKOUT:         'Knockout',
  GROUP_KNOCKOUT:   'Group + Knockout',
}

export const MATCH_STATUS_LABEL: Record<string, string> = {
  SCHEDULED:               'Scheduled',
  FIRST_HALF:              '1st Half',
  HALF_TIME:               'Half Time',
  SECOND_HALF:             '2nd Half',
  FULL_TIME:               'Full Time',
  EXTRA_TIME_FIRST_HALF:   'ET 1st',
  EXTRA_TIME_HALF_TIME:    'ET HT',
  EXTRA_TIME_SECOND_HALF:  'ET 2nd',
  EXTRA_TIME_FULL_TIME:    'AET',
  PENALTY_SHOOTOUT:        'Penalties',
  COMPLETED:               'Full Time',
  CANCELLED:               'Cancelled',
  POSTPONED:               'Postponed',
}
