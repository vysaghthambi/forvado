// Skeleton matches: breadcrumb + TournamentAdminPanel (tabbed sections)
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function ManageTournamentLoading() {
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

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <S w={200} h={22} r={6} />
          <S w={140} h={13} r={4} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <S w={90} h={32} r={7} />
          <S w={110} h={32} r={7} />
        </div>
      </div>

      {/* Tabs bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[80, 100, 80, 100, 90].map((w, i) => (
          <div key={i} style={{ padding: '8px 14px' }}>
            <S w={w} h={12} r={4} />
          </div>
        ))}
      </div>

      {/* Active tab content: settings form */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
          <S w={120} h={12} r={4} />
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <S w={100} h={12} r={4} />
              <S w="100%" h={36} r={8} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <S w={80} h={12} r={4} />
                <S w="100%" h={36} r={8} />
              </div>
            ))}
          </div>
          <S w={140} h={38} r={8} />
        </div>
      </div>

      {/* Teams list card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <S w={80} h={12} r={4} />
          <S w={120} h={28} r={7} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(35,38,56,.4)' }}>
            <S w={32} h={32} r={8} />
            <div style={{ flex: 1 }}>
              <S w={130} h={12} r={4} />
            </div>
            <S w={60} h={20} r={5} />
            <S w={28} h={28} r={6} />
          </div>
        ))}
      </div>
    </div>
  )
}
