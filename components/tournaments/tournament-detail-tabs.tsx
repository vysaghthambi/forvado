'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Tab {
  value: string
  label: string
}

interface Props {
  tabs: Tab[]
  activeTab: string
  standings?: React.ReactNode
  fixtures: React.ReactNode
  teams: React.ReactNode
  manage?: React.ReactNode
}

export function TournamentDetailTabs({ tabs, activeTab, standings, fixtures, teams, manage }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleTabClick(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const contentMap: Record<string, React.ReactNode> = {
    standings,
    fixtures,
    teams,
    manage,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 3,
          background: 'var(--card2, #1d2035)',
          borderRadius: 8,
          padding: 3,
          border: '1px solid var(--border)',
          width: 'fit-content',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--text)' : 'var(--muted-clr)',
                background: active ? 'var(--card)' : 'transparent',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,.35)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all .15s',
                fontFamily: 'var(--font-sans), DM Sans, sans-serif',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>{contentMap[activeTab] ?? contentMap['fixtures']}</div>
    </div>
  )
}
