'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Tab {
  value: string
  label: string
  count: number
}

interface Props {
  tabs: Tab[]
  activeTab: string
}

export function TournamentFilterTabs({ tabs, activeTab }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`/tournaments?${params.toString()}`)
  }

  return (
    <div
      className="flex flex-wrap gap-[3px]"
      style={{
        background: 'var(--card2, #1d2035)',
        borderRadius: 8,
        padding: 3,
        border: '1px solid var(--border)',
        width: 'fit-content',
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => handleClick(tab.value)}
            className="flex items-center gap-[5px] transition-all duration-200"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--text)' : 'var(--muted-clr)',
              background: active ? 'var(--card)' : 'transparent',
              boxShadow: active ? '0 2px 8px rgba(0,0,0,.35)' : 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
