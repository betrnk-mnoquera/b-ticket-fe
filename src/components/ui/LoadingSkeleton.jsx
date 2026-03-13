'use client'

export default function LoadingSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-3 bg-muted rounded w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  {c === 0 ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-muted" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 bg-muted rounded w-28" />
                        <div className="h-2.5 bg-muted rounded w-16" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-3.5 bg-muted rounded w-24" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-${i}`}
          className="rounded-xl border border-border bg-card p-5 shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
            <div className="w-14 h-5 rounded-full bg-muted animate-pulse" />
          </div>
          <div
            className="w-24 h-7 bg-muted rounded animate-pulse mb-1"
            style={{ animationDelay: `${i * 100}ms` }}
          />
          <div
            className="w-32 h-3 bg-muted rounded animate-pulse mt-2"
            style={{ animationDelay: `${i * 100 + 50}ms` }}
          />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />
          <div className="w-16 h-5 rounded-full bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}