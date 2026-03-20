// Skeleton matches: title + grid of tournament cards
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function CoordinatorLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <S w={200} h={24} r={6} />
      <S w={220} h={13} r={4} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 13 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <S w={130} h={13} r={4} />
              <S w={60} h={20} r={5} />
            </div>
            <S w={90} h={11} r={3} />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <S w={50} h={18} r={4} />
              <S w={50} h={18} r={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
