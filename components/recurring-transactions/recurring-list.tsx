import { AlertCircleIcon, RepeatIcon } from "lucide-react"

import type { RecurringTransactionWithRelations } from "@/types/recurring-transaction"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

import { RecurringCard } from "./recurring-card"

function RecurringCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  )
}

interface RecurringListProps {
  recurringTransactions: RecurringTransactionWithRelations[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onCreateRecurring: () => void
  onEditRecurring: (item: RecurringTransactionWithRelations) => void
  onDeleteRecurring: (item: RecurringTransactionWithRelations) => void
  onToggleActive: (item: RecurringTransactionWithRelations) => void
}

export function RecurringList({
  recurringTransactions,
  loading,
  error,
  onRetry,
  onCreateRecurring,
  onEditRecurring,
  onDeleteRecurring,
  onToggleActive,
}: RecurringListProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <RecurringCardSkeleton key={index} />
        ))}
      </section>
    )
  }

  if (error) {
    return (
      <EmptyState className="border-border/60 bg-card/70 py-14">
        <AlertCircleIcon className="size-6 text-muted-foreground" />
        <EmptyStateTitle className="mt-4">Unable to load recurring transactions</EmptyStateTitle>
        <EmptyStateDescription>{error}</EmptyStateDescription>
        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry
          </Button>
          <Button type="button" onClick={onCreateRecurring}>
            Create Recurring Transaction
          </Button>
        </div>
      </EmptyState>
    )
  }

  if (!recurringTransactions.length) {
    return (
      <EmptyState className="border-border/60 bg-card/70 py-14">
        <RepeatIcon className="size-6 text-muted-foreground" />
        <EmptyStateTitle className="mt-4">No recurring transactions yet</EmptyStateTitle>
        <EmptyStateDescription>
          Create your first recurring transaction to automate income and expense flows.
        </EmptyStateDescription>
        <div className="mt-5">
          <Button type="button" onClick={onCreateRecurring}>
            Create your first recurring transaction
          </Button>
        </div>
      </EmptyState>
    )
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {recurringTransactions.map((item) => (
        <RecurringCard
          key={item.id}
          recurring={item}
          onEdit={onEditRecurring}
          onDelete={onDeleteRecurring}
          onToggleActive={onToggleActive}
        />
      ))}
    </section>
  )
}
