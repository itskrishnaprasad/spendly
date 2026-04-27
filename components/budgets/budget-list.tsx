import { AlertCircleIcon, SparklesIcon } from "lucide-react"

import type { BudgetProgress, BudgetWithRelations } from "@/types/budget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

import { BudgetCard } from "./budget-card"

function BudgetCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  )
}

interface BudgetListProps {
  budgets: BudgetWithRelations[]
  progress: BudgetProgress[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onCreateBudget: () => void
  onEditBudget: (budget: BudgetWithRelations) => void
  onDeleteBudget: (budget: BudgetWithRelations) => void
}

export function BudgetList({
  budgets,
  progress,
  loading,
  error,
  onRetry,
  onCreateBudget,
  onEditBudget,
  onDeleteBudget,
}: BudgetListProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <BudgetCardSkeleton key={index} />
        ))}
      </section>
    )
  }

  if (error) {
    return (
      <EmptyState className="border-border/60 bg-card/70 py-14">
        <AlertCircleIcon className="size-6 text-muted-foreground" />
        <EmptyStateTitle className="mt-4">Unable to load budgets</EmptyStateTitle>
        <EmptyStateDescription>{error}</EmptyStateDescription>
        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry
          </Button>
          <Button type="button" onClick={onCreateBudget}>
            Create Budget
          </Button>
        </div>
      </EmptyState>
    )
  }

  if (!budgets.length) {
    return (
      <EmptyState className="border-border/60 bg-card/70 py-14">
        <SparklesIcon className="size-6 text-muted-foreground" />
        <EmptyStateTitle className="mt-4">No budgets yet</EmptyStateTitle>
        <EmptyStateDescription>
          Set your first budget to track spending and stay aligned with your financial goals.
        </EmptyStateDescription>
        <div className="mt-5">
          <Button type="button" onClick={onCreateBudget}>
            Create your first budget
          </Button>
        </div>
      </EmptyState>
    )
  }

  const progressMap = new Map(progress.map((item) => [item.id, item]))

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          progress={progressMap.get(budget.id) ?? null}
          onEdit={onEditBudget}
          onDelete={onDeleteBudget}
        />
      ))}
    </section>
  )
}
