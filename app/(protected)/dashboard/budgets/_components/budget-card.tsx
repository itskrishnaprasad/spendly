import { MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react"

import type { BudgetProgress, BudgetWithRelations } from "@/types/budget"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0
  }

  return typeof value === "string" ? Number(value) : value
}

function getProgressState(progress: BudgetProgress | null) {
  if (!progress) {
    return {
      label: "No spend yet",
      badgeVariant: "outline" as const,
      barClassName: "bg-primary",
    }
  }

  if (progress.is_exceeded) {
    return {
      label: "Exceeded",
      badgeVariant: "destructive" as const,
      barClassName: "bg-destructive",
    }
  }

  if (progress.is_alert_reached) {
    return {
      label: "Alert reached",
      badgeVariant: "secondary" as const,
      barClassName: "bg-chart-2",
    }
  }

  return {
    label: "On track",
    badgeVariant: "outline" as const,
    barClassName: "bg-primary",
  }
}

interface BudgetCardProps {
  budget: BudgetWithRelations
  progress: BudgetProgress | null
  onEdit: (budget: BudgetWithRelations) => void
  onDelete: (budget: BudgetWithRelations) => void
}

export function BudgetCard({ budget, progress, onEdit, onDelete }: BudgetCardProps) {
  const budgetAmount = toNumber(budget.amount)
  const spentAmount = progress?.spent_amount ?? 0
  const remainingAmount = progress?.remaining_amount ?? budgetAmount
  const percentage = progress?.progress_percentage ?? 0
  const displayPercentage = Math.max(0, Math.min(100, percentage))
  const progressState = getProgressState(progress)

  const scopeLabel = budget.category?.name ?? "All categories"
  const accountLabel = budget.account?.name ?? "All accounts"

  return (
    <Card className="h-full border-border/60 bg-card/85 shadow-xs">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{budget.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary" className="font-normal">
                {budget.period}
              </Badge>
              <span>{scopeLabel}</span>
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${budget.name}`}>
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 min-w-40">
              <DropdownMenuItem onSelect={() => onEdit(budget)}>
                <PencilIcon className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(budget)}
              >
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={progressState.badgeVariant}>{progressState.label}</Badge>
          <p className="text-xs text-muted-foreground">{accountLabel}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(budgetAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(spentAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={displayPercentage} indicatorClassName={progressState.barClassName} />
        </div>
      </CardContent>
    </Card>
  )
}
