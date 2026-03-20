// Skeleton matches: back button + title, then a single card with form fields
const S = ({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg3)', flexShrink: 0 }} />
)

function Field() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <S w={80} h={12} r={4} />
      <S w="100%" h={36} r={8} />
    </div>
  )
}

export default function ProfileLoading() {
  return (
    <div className="animate-pulse mx-auto" style={{ maxWidth: 512, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <S w={32} h={32} r={8} />
        <S w={80} h={20} r={5} />
      </div>

      {/* Form card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <S w={80} h={80} r={40} />
          <S w={120} h={30} r={8} />
        </div>
        <Field />
        <Field />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field />
          <Field />
        </div>
        <Field />
        <S w="100%" h={38} r={8} />
      </div>
    </div>
  )
}
