// Skeleton matches: page head + 2-col grid [active tournaments list | live + upcoming sidebar]
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

function CardHeader({ label }: { label?: boolean }) {
  return (
    <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {label ? <S w={120} h={11} r={4} /> : <S w={100} h={11} r={4} />}
      <S w={60} h={22} r={6} />
    </div>
  )
}

function ListRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', borderBottom: '1px solid rgba(35,38,56,.5)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <S w={160} h={12} r={4} />
        <S w={100} h={10} r={3} />
      </div>
      <S w={64} h={20} r={5} />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Page head */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <S w={140} h={22} r={6} />
        <S w={260} h={13} r={4} />
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* Left — Active Tournaments card */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <CardHeader />
          {[...Array(5)].map((_, i) => <ListRow key={i} />)}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live matches widget */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <CardHeader />
            <div style={{ padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <S w="100%" h={52} r={8} />
              <S w="100%" h={52} r={8} />
            </div>
          </div>

          {/* Upcoming Fixtures */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <CardHeader />
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ padding: '12px 15px', borderBottom: '1px solid rgba(35,38,56,.5)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <S w={90} h={10} r={3} />
                <S w={160} h={12} r={4} />
                <S w={110} h={10} r={3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
