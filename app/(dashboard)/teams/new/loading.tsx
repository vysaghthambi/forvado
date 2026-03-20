// Skeleton matches: breadcrumb + page head + CreateTeamForm card (colour picker, inputs, submit)
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

function Field({ label = 80 }: { label?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <S w={label} h={12} r={4} />
      <S w="100%" h={36} r={8} />
    </div>
  )
}

export default function NewTeamLoading() {
  return (
    <div className="animate-pulse" style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <S w={40} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={80} h={12} r={4} />
      </div>

      {/* Page head */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <S w={130} h={22} r={6} />
        <S w={260} h={13} r={4} />
      </div>

      {/* Form card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label={60} />
        {/* Colour pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <S w={90} h={12} r={4} />
            <S w="100%" h={40} r={8} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <S w={90} h={12} r={4} />
            <S w="100%" h={40} r={8} />
          </div>
        </div>
        <Field label={100} />
        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8 }}>
          <S w={140} h={13} r={4} />
          <S w={36} h={20} r={10} />
        </div>
        <S w="100%" h={40} r={8} />
      </div>
    </div>
  )
}
