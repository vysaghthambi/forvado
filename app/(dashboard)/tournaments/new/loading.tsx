// Skeleton matches: breadcrumb + page head + CreateTournamentForm (multi-section card)
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

function Field({ label = 100, full = false }: { label?: number; full?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <S w={label} h={12} r={4} />
      <S w="100%" h={full ? 80 : 36} r={8} />
    </div>
  )
}

export default function NewTournamentLoading() {
  return (
    <div className="animate-pulse" style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <S w={80} h={12} r={4} />
        <S w={6} h={6} r={3} />
        <S w={120} h={12} r={4} />
      </div>

      {/* Page head */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <S w={180} h={22} r={6} />
        <S w={300} h={13} r={4} />
      </div>

      {/* Form card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Section: Basic Info */}
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
          <S w={80} h={12} r={4} />
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label={60} />
          <Field label={80} full />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label={60} />
            <Field label={60} />
          </div>
          <Field label={70} />
        </div>

        {/* Section: Match Settings */}
        <div style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <S w={110} h={12} r={4} />
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label={100} />
            <Field label={80} />
            <Field label={80} />
          </div>
        </div>

        {/* Submit */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <S w={160} h={38} r={8} />
        </div>
      </div>
    </div>
  )
}
