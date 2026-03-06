export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-64 rounded-lg bg-muted" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
