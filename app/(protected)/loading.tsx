import { Skeleton } from "@/components/ui/skeleton"

export default function ProtectedLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 w-full">
      {/* Decorative background blur to match dashboard */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden">
        <div className="absolute -left-20 -top-24 size-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 -top-20 size-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-40 mt-4" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-xs h-[400px]">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-full w-full rounded-md mt-4" />
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-xs h-[400px]">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center justify-center h-full mt-4">
            <Skeleton className="size-[200px] rounded-full" />
          </div>
        </div>
      </div>

      {/* Tables/Lists Skeleton */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-xs min-h-[400px]">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-6 shadow-xs min-h-[400px]">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 py-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
