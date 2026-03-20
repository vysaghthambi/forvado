// Skeleton matches: page head + search bar + team cards grid
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function TeamsLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <S w={80} h={22} r={6} />
          <S w={180} h={13} r={4} />
        </div>
        <S w={120} h={34} r={8} />
      </div>

      {/* Search bar */}
      <S w="100%" h={36} r={8} />

      {/* Team cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Colour strip */}
            <div style={{ height: 6, background: 'var(--bg3)' }} />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <S w={48} h={48} r={12} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <S w={100} h={13} r={4} />
                  <S w={70} h={11} r={3} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <S w={52} h={18} r={4} />
                <S w={52} h={18} r={4} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
