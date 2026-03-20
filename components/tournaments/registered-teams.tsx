import Link from 'next/link'

interface TTeam {
  team: { id: string; name: string; badgeUrl: string | null; homeColour?: string | null }
  group?: { id: string; name: string } | null
}

interface Props {
  teams: TTeam[]
}

export function RegisteredTeams({ teams }: Props) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2" style={{ padding: '24px 8px', textAlign: 'center' }}>
        <span style={{ fontSize: 28, opacity: 0.35 }}>👥</span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No teams registered yet.</span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 10,
      }}
    >
      {teams.map(({ team, group }) => {
        const colour = team.homeColour ?? '#2d3050'
        const bg = colour + '33'
        const initials = team.name.slice(0, 3).toUpperCase()

        return (
          <Link key={team.id} href={`/teams/${team.id}`} className="block no-underline group">
            <div
              className="flex items-center gap-3 transition-all duration-200 group-hover:bg-white/[0.025]"
              style={{
                padding: '10px 12px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}
            >
              {/* Badge */}
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: bg, border: `1px solid ${colour}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                fontSize: 11, fontWeight: 700, color: colour, letterSpacing: '0.5px',
              }}>
                {initials}
              </div>

              {/* Info */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="truncate"
                  style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}
                >
                  {team.name}
                </div>
                {group && (
                  <div style={{ fontSize: 10, color: 'var(--muted-clr)', marginTop: 2 }}>
                    Group {group.name}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
