export default function TournamentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="h-8 w-32 rounded-lg bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-20 rounded-lg bg-muted" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
