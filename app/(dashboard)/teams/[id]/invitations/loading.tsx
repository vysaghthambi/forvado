// Skeleton matches: back + title, then invitation/request rows
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function InvitationsLoading() {
  return (
    <div className="animate-pulse mx-auto" style={{ maxWidth: 672, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <S w={32} h={32} r={8} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <S w={180} h={18} r={5} />
          <S w={100} h={12} r={4} />
        </div>
      </div>

      {/* Invitation list card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <S w={100} h={12} r={4} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(35,38,56,.4)' }}>
            <S w={36} h={36} r={18} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <S w={120} h={13} r={4} />
              <S w={80} h={11} r={3} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <S w={64} h={30} r={7} />
              <S w={64} h={30} r={7} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
