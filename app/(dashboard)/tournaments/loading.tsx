export default function TournamentsLoading() {
  return (
    <div className="flex flex-col gap-[18px] animate-pulse">
      {/* Page head skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div style={{ height: 26, width: 140, borderRadius: 6, background: 'var(--bg3)' }} />
          <div style={{ height: 12, width: 200, borderRadius: 4, background: 'var(--bg3)', marginTop: 6 }} />
        </div>
        <div style={{ height: 32, width: 140, borderRadius: 8, background: 'var(--bg3)' }} />
      </div>

      {/* Filter + search skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div style={{ height: 34, width: 320, borderRadius: 8, background: 'var(--bg3)' }} />
        <div style={{ height: 30, width: 200, borderRadius: 8, background: 'var(--bg3)' }} />
      </div>

      {/* Card grid skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 13,
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{ height: 110, borderRadius: 12, background: 'var(--bg3)' }}
          />
        ))}
      </div>
    </div>
  )
}
