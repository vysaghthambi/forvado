// Skeleton matches: page head + 4-col KPI grid + users table
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

export default function AdminLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1080, margin: '0 auto' }}>

      {/* Page head */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <S w={140} h={22} r={6} />
        <S w={280} h={13} r={4} />
      </div>

      {/* KPI grid — 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
            {/* Top accent strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--bg3)' }} />
            <S w={60} h={10} r={3} />
            <S w={50} h={30} r={6} />
            <S w={80} h={11} r={3} />
          </div>
        ))}
      </div>

      {/* Users table card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <S w={200} h={30} r={8} />
          <S w={120} h={30} r={8} />
        </div>

        {/* Table header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: 0, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          {[140, 180, 80, 70, 70].map((w, i) => <S key={i} w={w} h={10} r={3} />)}
        </div>

        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: 0, padding: '13px 16px', borderBottom: '1px solid rgba(35,38,56,.4)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <S w={28} h={28} r={14} />
              <S w={110} h={11} r={4} />
            </div>
            <S w={150} h={11} r={4} />
            <S w={60} h={20} r={5} />
            <S w={50} h={11} r={4} />
            <S w={40} h={11} r={4} />
          </div>
        ))}
      </div>
    </div>
  )
}
