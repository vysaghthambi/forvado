// Skeleton matches: breadcrumb + page head + fixture groups with match rows
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

function MatchRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid rgba(35,38,56,.4)' }}>
      <S w={120} h={12} r={4} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <S w={70} h={12} r={4} />
        <S w={40} h={20} r={5} />
        <S w={70} h={12} r={4} />
      </div>
      <S w={60} h={20} r={5} />
    </div>
  )
}

export default function FixturesLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
        <S w={80} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={140} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={60} h={12} r={4} />
      </div>

      {/* Page head + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <S w={160} h={22} r={6} />
          <S w={120} h={13} r={4} />
        </div>
        <S w={150} h={34} r={8} />
      </div>

      {/* Fixture groups */}
      {[...Array(3)].map((_, g) => (
        <div key={g} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
            <S w={100} h={12} r={4} />
          </div>
          {[...Array(4)].map((__, i) => <MatchRow key={i} />)}
        </div>
      ))}
    </div>
  )
}
