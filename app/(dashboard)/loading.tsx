// Minimal fallback — each page has its own loading.tsx
export default function DashboardLayoutLoading() {
  return (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 22, width: 160, borderRadius: 6, background: 'var(--bg3)' }} />
      <div style={{ height: 13, width: 240, borderRadius: 4, background: 'var(--bg3)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginTop: 8 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 100, borderRadius: 12, background: 'var(--bg3)' }} />
        ))}
      </div>
    </div>
  )
}
