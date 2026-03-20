// Skeleton matches: page head + filter/search bar + tournament card grid
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function TournamentsLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <S w={140} h={22} r={6} />
          <S w={200} h={13} r={4} />
        </div>
        <S w={150} h={34} r={8} />
      </div>

      {/* Filter + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <S w={300} h={34} r={8} />
        <S w={180} h={30} r={8} />
      </div>

      {/* Tournament card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 13 }}>
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <S w={140} h={14} r={4} />
              <S w={64} h={20} r={5} />
            </div>
            <S w={100} h={11} r={3} />
            <div style={{ display: 'flex', gap: 6 }}>
              <S w={52} h={18} r={4} />
              <S w={52} h={18} r={4} />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <S w={80} h={11} r={3} />
              <S w={60} h={11} r={3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
