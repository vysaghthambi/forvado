// Skeleton matches: breadcrumb + gradient score hero + POTM banner + 2-col lineup tables
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

function LineupTableSkeleton() {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <S w={10} h={10} r={5} />
        <S w={100} h={12} r={4} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {[30, 120, 50, 60].map((w, i) => (
              <th key={i} style={{ padding: '8px 12px', textAlign: 'left' }}>
                <S w={w} h={10} r={3} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(7)].map((_, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(35,38,56,.4)' }}>
              <td style={{ padding: '9px 12px' }}><S w={24} h={12} r={3} /></td>
              <td style={{ padding: '9px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <S w={9} h={9} r={5} />
                  <S w={100} h={12} r={4} />
                </div>
              </td>
              <td style={{ padding: '9px 12px' }}><S w={30} h={12} r={3} /></td>
              <td style={{ padding: '9px 12px' }}><S w={40} h={12} r={3} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MatchDetailLoading() {
  return (
    <div className="animate-pulse" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
        <S w={80} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={120} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={140} h={12} r={4} />
      </div>

      {/* Match score hero */}
      <div style={{ background: 'linear-gradient(155deg,#0c1322 0%,#12102a 50%,#0f1a12 100%)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px 22px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, alignItems: 'flex-start' }}>
          {/* Home team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 20 }}>
            <S w={58} h={58} r={13} />
            <S w={110} h={16} r={5} />
            <S w={60} h={11} r={3} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'flex-end', padding: '0 16px' }}>
              {[...Array(3)].map((_, i) => <S key={i} w={120} h={12} r={4} />)}
            </div>
          </div>

          {/* Score center */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 8px 22px', flexShrink: 0 }}>
            <S w={60} h={11} r={4} />
            <S w={100} h={52} r={8} />
            <S w={70} h={20} r={5} />
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 20 }}>
            <S w={58} h={58} r={13} />
            <S w={110} h={16} r={5} />
            <S w={60} h={11} r={3} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'flex-start', padding: '0 16px' }}>
              {[...Array(3)].map((_, i) => <S key={i} w={120} h={12} r={4} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Player of Match banner */}
      <div style={{ height: 44, borderRadius: 10, background: 'rgba(245,200,66,.06)', border: '1px solid rgba(245,200,66,.15)' }} />

      {/* Lineup tables — 2 col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <LineupTableSkeleton />
        <LineupTableSkeleton />
      </div>
    </div>
  )
}
