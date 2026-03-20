'use client'

import { useState, Suspense } from 'react'
import { TournamentCard } from './tournament-card'
import { TournamentFilterTabs } from './tournament-filter-tabs'

interface Tournament {
  id: string
  name: string
  format: string
  status: string
  startDate: string
  endDate: string
  venue?: string | null
  maxTeams: number
  isPublished: boolean
  _count: { teams: number; matches: number }
}

interface Tab {
  value: string
  label: string
  count: number
}

interface Props {
  tournaments: Tournament[]
  tabs: Tab[]
  activeTab: string
  showDraft: boolean
}

export function TournamentsList({ tournaments, tabs, activeTab, showDraft }: Props) {
  const [search, setSearch] = useState('')

  const filtered = tournaments.filter((t) => {
    const matchesTab =
      activeTab === 'all' ? true :
      activeTab === 'ongoing' ? t.status === 'ONGOING' :
      activeTab === 'upcoming' ? ['REGISTRATION', 'UPCOMING'].includes(t.status) :
      activeTab === 'completed' ? t.status === 'COMPLETED' :
      activeTab === 'draft' ? t.status === 'DRAFT' : true

    const matchesSearch = search.trim() === '' || t.name.toLowerCase().includes(search.toLowerCase())

    return matchesTab && matchesSearch
  })

  return (
    <>
      {/* Filter + Search row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Suspense>
          <TournamentFilterTabs tabs={tabs} activeTab={activeTab} />
        </Suspense>

        {/* Search */}
        <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
          <svg
            viewBox="0 0 24 24"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 12,
              height: 12,
              stroke: 'var(--muted-clr)',
              fill: 'none',
              strokeWidth: 2,
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search tournaments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card2, #1d2035)',
              color: 'var(--text)',
              fontSize: 12,
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border2)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, opacity: 0.35 }}>🔍</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            No tournaments match your filter.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 13,
          }}
        >
          {filtered.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </>
  )
}
