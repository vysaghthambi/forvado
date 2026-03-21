// Skeleton matches: breadcrumb + Control Panel heading + compact hero + phase control +
// event logger + event log + lineup grid (2 col) + penalty tracker
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

function Card({ headerLabel, children, headerAction }: { headerLabel: number; children: React.ReactNode; headerAction?: boolean }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <S w={headerLabel} h={12} r={4} />
        {headerAction && <S w={80} h={26} r={6} />}
      </div>
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  )
}

export default function MatchControlLoading() {
  return (
    <div className="animate-pulse" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
        <S w={80} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={120} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={130} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={60} h={12} r={4} />
      </div>

      {/* Control Panel heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <S w={150} h={22} r={6} />
          <S w={180} h={13} r={4} />
        </div>
        <S w={110} h={32} r={8} />
      </div>

      {/* Compact score hero */}
      <div style={{ background: 'linear-gradient(155deg,#0c1322 0%,#12102a 50%,#0f1a12 100%)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <S w={40} h={40} r={10} />
            <S w="80%" h={14} r={5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <S w={50} h={10} r={4} />
            <S w={80} h={44} r={8} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <S w={40} h={40} r={10} />
            <S w="80%" h={14} r={5} />
          </div>
        </div>
      </div>

      {/* Phase control */}
      <Card headerLabel={100}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[...Array(4)].map((_, i) => <S key={i} w={120} h={36} r={8} />)}
        </div>
      </Card>

      {/* Event logger */}
      <Card headerLabel={80}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <S w="100%" h={36} r={8} />
            <S w="100%" h={36} r={8} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
            <S w="100%" h={36} r={8} />
            <S w="100%" h={36} r={8} />
            <S w="100%" h={36} r={8} />
          </div>
          <S w={120} h={36} r={8} />
        </div>
      </Card>

      {/* Event log */}
      <Card headerLabel={70}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(35,38,56,.4)' }}>
              <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
                <S w={28} h={11} r={3} />
                <S w={16} h={16} r={4} />
                <S w={100} h={12} r={4} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <S w={26} h={26} r={6} />
                <S w={26} h={26} r={6} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Lineup panels — 2 col on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, t) => (
          <Card key={t} headerLabel={100} headerAction>
            {[...Array(5)].map((__, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(35,38,56,.4)' }}>
                <S w={24} h={24} r={6} />
                <S w={110} h={12} r={4} />
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Back link */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <S w={140} h={36} r={8} />
      </div>
    </div>
  )
}
