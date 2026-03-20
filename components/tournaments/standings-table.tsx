import type { StandingRow } from '@/services/standings'

interface Props {
  rows: StandingRow[]
  title?: string
  promotionSpots?: number
  /** Strip outer card wrapper — use when already rendered inside a card */
  naked?: boolean
}

const FORM_STYLE: Record<'W' | 'D' | 'L', { bg: string; color: string }> = {
  W: { bg: 'var(--green)',       color: '#fff' },
  D: { bg: 'rgba(94,98,128,.5)', color: 'var(--text2)' },
  L: { bg: 'var(--live)',        color: '#fff' },
}

export function StandingsTable({ rows, title, promotionSpots = 0, naked = false }: Props) {
  const content = (
    <>
      {title && (
        <div style={{
          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
          fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.6px', color: 'var(--muted-clr)',
          padding: naked ? '10px 14px 0' : '0 0 10px 0',
        }}>
          {title}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 24, opacity: 0.35 }}>⚽</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No standings yet.</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead>
              <tr>
                <th style={thStyle({ width: 28, minWidth: 28 })}>#</th>
                <th style={thStyle({ minWidth: 120 })}>Team</th>
                <th style={thStyle({ textAlign: 'center', width: 32, minWidth: 32 })}>P</th>
                <th style={thStyle({ textAlign: 'center', width: 32, minWidth: 32 })}>W</th>
                <th style={thStyle({ textAlign: 'center', width: 32, minWidth: 32 })}>D</th>
                <th style={thStyle({ textAlign: 'center', width: 32, minWidth: 32 })}>L</th>
                <th style={thStyle({ textAlign: 'center', width: 40, minWidth: 40 })}>GD</th>
                <th style={thStyle({ textAlign: 'center', width: 40, minWidth: 40 })}>Pts</th>
                <th style={thStyle({ textAlign: 'center', width: 100, minWidth: 100 })}>Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isPromoted  = promotionSpots > 0 && i < promotionSpots
                const isEliminated = promotionSpots > 0 && i >= rows.length - promotionSpots && rows.length > promotionSpots * 2
                const isLast = i === rows.length - 1

                let posColor = 'var(--muted-clr)'
                if (isPromoted) posColor = 'var(--accent-clr)'
                else if (isEliminated) posColor = 'var(--live)'
                else if (i < 3) posColor = 'var(--blue)'

                const gd = row.goalDifference
                const gdColor = gd > 0 ? 'var(--green)' : gd < 0 ? 'var(--live)' : 'var(--text2)'

                return (
                  <tr key={row.teamId} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(35,38,56,.7)' }}>
                    <td style={{ ...tdStyle(), textAlign: 'center', width: 28, minWidth: 28 }}>
                      <span style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, color: posColor }}>
                        {i + 1}
                      </span>
                    </td>

                    <td style={{ ...tdStyle(), minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          background: 'var(--bg3)', border: '1px solid var(--border2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                          fontSize: 9, fontWeight: 700, color: 'var(--text2)',
                        }}>
                          {row.teamName.slice(0, 3).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: 12 }}>{row.teamName}</span>
                      </div>
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'center', minWidth: 32 }}>{row.played}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center', minWidth: 32 }}>{row.won}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center', minWidth: 32 }}>{row.drawn}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center', minWidth: 32 }}>{row.lost}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center', color: gdColor, minWidth: 40 }}>
                      {gd > 0 ? `+${gd}` : gd}
                    </td>
                    <td style={{ ...tdStyle(), textAlign: 'center', minWidth: 40 }}>
                      <b style={{ fontFamily: 'var(--font-heading), Rajdhani, sans-serif', fontSize: 14, color: 'var(--text)' }}>
                        {row.points}
                      </b>
                    </td>
                    <td style={{ ...tdStyle(), textAlign: 'center', width: 100, minWidth: 100 }}>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                        {row.form.length === 0 ? (
                          <span style={{ fontSize: 10, color: 'var(--muted-clr)' }}>—</span>
                        ) : (
                          row.form.map((r, fi) => {
                            const s = FORM_STYLE[r]
                            return (
                              <span key={fi} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 16, height: 16, borderRadius: 4,
                                fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-heading), Rajdhani, sans-serif',
                                background: s.bg, color: s.color, letterSpacing: 0,
                              }}>
                                {r}
                              </span>
                            )
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {promotionSpots > 0 && rows.length > 0 && (
        <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 16, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--muted-clr)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-clr)' }} />
            Qualifies — top {promotionSpots}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--live)' }} />
            Eliminated
          </div>
        </div>
      )}
    </>
  )

  if (naked) return <div>{content}</div>

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {content}
    </div>
  )
}

function thStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    fontSize: 10, fontWeight: 500, color: 'var(--muted-clr)',
    textTransform: 'uppercase', letterSpacing: '0.6px',
    padding: '9px 14px', textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(255,255,255,.015)',
    whiteSpace: 'nowrap',
    ...extra,
  }
}

function tdStyle(): React.CSSProperties {
  return { padding: '10px 14px', verticalAlign: 'middle', color: 'var(--text2)', fontSize: 12, whiteSpace: 'nowrap' }
}
