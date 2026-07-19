export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4 rounded-xl bg-white/[0.03] animate-pulse"
        >
          <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/[0.06] rounded-lg w-24" />
            <div className="h-3 bg-white/[0.04] rounded-lg w-16" />
          </div>
          <div className="h-4 bg-white/[0.06] rounded-lg w-20" />
          <div className="h-4 bg-white/[0.06] rounded-lg w-16" />
          <div className="h-8 bg-white/[0.06] rounded-lg w-16" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse space-y-4">
      <div className="h-5 bg-white/[0.06] rounded-lg w-32" />
      <div className="h-8 bg-white/[0.06] rounded-lg w-48" />
      <div className="h-4 bg-white/[0.04] rounded-lg w-24" />
    </div>
  )
}

export function SpinnerDots() {
  return (
    <div className="flex items-center gap-1.5 justify-center py-2">
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
