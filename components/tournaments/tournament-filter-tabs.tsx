'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

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
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = activeTab === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => handleClick(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
              active
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0 text-[10px] font-bold',
                  active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
