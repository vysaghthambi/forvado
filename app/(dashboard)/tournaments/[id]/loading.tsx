// Skeleton matches: breadcrumb + gradient hero (badge, name, stat strip) + standings + stats/matches grid
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function TournamentDetailLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
        <S w={80} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={140} h={12} r={4} />
      </div>

      {/* Hero card */}
      <div style={{ background: 'linear-gradient(135deg,#0c1322 0%,#12102a 60%,#0f1510 100%)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '22px 22px 0', display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          {/* Logo badge */}
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,.06)', flexShrink: 0 }} />
          {/* Info */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <S w={220} h={22} r={6} />
              <S w={70} h={22} r={5} />
            </div>
            <S w={280} h={13} r={4} />
            <div style={{ display: 'flex', gap: 6 }}>
              <S w={60} h={20} r={4} />
              <S w={60} h={20} r={4} />
              <S w={72} h={20} r={4} />
              <S w={52} h={20} r={4} />
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <S w={90} h={30} r={7} />
            <S w={100} h={30} r={7} />
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--border)', marginTop: 20 }}>
          {['Played', 'Remaining', 'Goals', 'Teams'].map((l) => (
            <div key={l} style={{ background: 'rgba(12,19,34,.9)', padding: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <S w={24} h={18} r={4} />
              <S w={48} h={9} r={3} />
            </div>
          ))}
        </div>
      </div>

      {/* Standings table placeholder */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
          <S w={100} h={12} r={4} />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid rgba(35,38,56,.4)' }}>
            <S w={16} h={12} r={3} />
            <div style={{ flex: 1, minWidth: 0 }}><S w="60%" h={12} r={4} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[...Array(4)].map((__, j) => <S key={j} w={28} h={12} r={3} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Stats + Matches grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
              <S w={100} h={12} r={4} />
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(4)].map((__, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
                    <S w={8} h={8} r={4} />
                    <S w={110} h={12} r={4} />
                  </div>
                  <S w={24} h={18} r={4} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
