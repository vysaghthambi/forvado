// Skeleton matches: title + list of notification rows in a card
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function NotificationsLoading() {
  return (
    <div className="animate-pulse mx-auto" style={{ maxWidth: 672, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <S w={160} h={24} r={6} />

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(35,38,56,.4)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <S w={8} h={8} r={4} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <S w="55%" h={13} r={4} />
              <S w="80%" h={12} r={4} />
              <S w={80} h={10} r={3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
