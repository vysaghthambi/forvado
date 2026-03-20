// Skeleton matches: back button + team header card (colour strip, badge, info, actions) + roster card
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function TeamDetailLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Back button */}
      <S w={120} h={30} r={8} />

      {/* Team header card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Colour strip */}
        <div style={{ height: 6, background: 'var(--bg3)' }} />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Badge + info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <S w={80} h={80} r={16} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <S w={160} h={20} r={6} />
              <S w={110} h={13} r={4} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <S w={70} h={28} r={7} />
                <S w={80} h={28} r={7} />
              </div>
            </div>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                <S w={30} h={20} r={5} />
                <S w={50} h={11} r={3} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roster card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <S w={80} h={12} r={4} />
          <S w={100} h={28} r={7} />
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(35,38,56,.4)' }}>
            <S w={32} h={32} r={16} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <S w={130} h={12} r={4} />
              <S w={70} h={10} r={3} />
            </div>
            <S w={50} h={20} r={5} />
          </div>
        ))}
      </div>
    </div>
  )
}
