'use client'

import { useState } from 'react'
import { StandingsTable } from './standings-table'
import type { StandingRow } from '@/services/standings'

interface GroupData {
  groupId: string
  groupName: string
  rows: StandingRow[]
}

export function GroupStandingsTabs({ groups }: { groups: GroupData[] }) {
  const [active, setActive] = useState(groups[0]?.groupId ?? '')
  const current = groups.find((g) => g.groupId === active) ?? groups[0]

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header row: title + tabs inline */}
      <div style={{
        padding: '13px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          fontSize: 13, fontWeight: 700, letterSpacing: '.5px',
          textTransform: 'uppercase', color: 'var(--muted-foreground)',
        }}>
          Group Standings
        </span>

        {groups.length > 1 && (
          <>
            {/* Pill tabs — hidden on xs, shown on sm+ */}
            <div className="hidden sm:flex" style={{
              gap: 3,
              background: 'var(--card2, #1d2035)',
              borderRadius: 8, padding: 3,
              border: '1px solid var(--border)',
            }}>
              {groups.map((g) => {
                const isActive = g.groupId === active
                return (
                  <button
                    key={g.groupId}
                    onClick={() => setActive(g.groupId)}
                    style={{
                      padding: '4px 12px', borderRadius: 6,
                      fontSize: 11, fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--text)' : 'var(--muted-clr)',
                      background: isActive ? 'var(--card)' : 'transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,.35)' : 'none',
                      border: 'none', cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    Group {g.groupName}
                  </button>
                )
              })}
            </div>

            {/* Dropdown — shown on xs, hidden on sm+ */}
            <select
              className="sm:hidden"
              value={active}
              onChange={(e) => setActive(e.target.value)}
              style={{
                padding: '5px 10px', borderRadius: 7,
                border: '1px solid var(--border)',
                background: 'var(--card2, #1d2035)',
                color: 'var(--text)', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', outline: 'none',
              }}
            >
              {groups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  Group {g.groupName}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Table — no card wrapper, no border-radius */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 28, opacity: 0.35 }}>⚽</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No groups configured yet.</span>
        </div>
      ) : current ? (
        <StandingsTable rows={current.rows} promotionSpots={2} naked />
      ) : null}
    </div>
  )
}
