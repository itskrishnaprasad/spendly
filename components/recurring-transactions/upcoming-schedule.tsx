import { CalendarClockIcon } from "lucide-react"
import { format, parseISO } from "date-fns"

import type { RecurringTransactionWithRelations } from "@/types/recurring-transaction"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

function formatCurrency(value: number | string | null | undefined) {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0)
}

function formatScheduleDate(value: string) {
  return format(parseISO(value), "MMM d, yyyy")
}

function UpcomingScheduleSkeleton() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-xs">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border/60 p-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface UpcomingScheduleProps {
  recurringTransactions: RecurringTransactionWithRelations[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function UpcomingSchedule({
  recurringTransactions,
  loading,
  error,
  onRetry,
}: UpcomingScheduleProps) {
  const upcoming = recurringTransactions
    .filter((item) => item.is_active !== false)
    .slice(0, 5)

  if (loading) {
    return <UpcomingScheduleSkeleton />
  }

  if (error) {
    return (
      <EmptyState className="border-border/60 bg-card/70 py-10">
        <CalendarClockIcon className="size-6 text-muted-foreground" />
        <EmptyStateTitle className="mt-4">Unable to load upcoming schedule</EmptyStateTitle>
        <EmptyStateDescription>{error}</EmptyStateDescription>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium"
        >
          Retry
        </button>
      </EmptyState>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClockIcon className="size-4 text-primary" />
          Upcoming automated financial events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.frequency} • next run {formatScheduleDate(item.next_run_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      item.type === "income"
                        ? "font-semibold text-primary"
                        : "font-semibold text-destructive"
                    }
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {formatScheduleDate(item.next_run_date)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState className="border-0 bg-transparent py-6">
            <EmptyStateTitle>No upcoming runs yet</EmptyStateTitle>
            <EmptyStateDescription>
              Create a recurring item to populate the automation timeline.
            </EmptyStateDescription>
          </EmptyState>
        )}
      </CardContent>
    </Card>
  )
}
