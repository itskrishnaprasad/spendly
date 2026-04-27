import { AlertTriangleIcon, CircleCheckIcon, WalletIcon } from "lucide-react"

import type { BudgetProgress, BudgetWithRelations } from "@/types/budget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

interface BudgetProgressSummaryProps {
  budgets: BudgetWithRelations[]
  progress: BudgetProgress[]
}

export function BudgetProgressSummary({
  budgets,
  progress,
}: BudgetProgressSummaryProps) {
  const totalBudgetAmount = progress.reduce(
    (sum, item) => sum + item.budget_amount,
    0
  )
  const totalSpentAmount = progress.reduce((sum, item) => sum + item.spent_amount, 0)
  const totalRemainingAmount = totalBudgetAmount - totalSpentAmount
  const atRiskBudgets = progress.filter(
    (item) => item.is_alert_reached || item.is_exceeded
  ).length
  const exceededBudgets = progress.filter((item) => item.is_exceeded).length

  const overallPercentage =
    totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0
  const clampedOverall = Math.min(100, Math.max(0, overallPercentage))

  const indicatorClassName =
    overallPercentage > 100
      ? "bg-destructive"
      : overallPercentage >= 80
        ? "bg-chart-2"
        : "bg-primary"

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Budgeted</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(totalBudgetAmount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Across {budgets.length} budget{budgets.length === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Spent This Period</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(totalSpentAmount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tracked from expense transactions only</p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(totalRemainingAmount)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <WalletIcon className="size-3.5" />
            <span>{atRiskBudgets} budget(s) at risk</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Budget Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{overallPercentage.toFixed(1)}%</span>
            <span className="text-muted-foreground">used</span>
          </div>
          <Progress value={clampedOverall} indicatorClassName={indicatorClassName} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <AlertTriangleIcon className="size-3.5" />
              {atRiskBudgets} warning
            </span>
            <span className="inline-flex items-center gap-1">
              <CircleCheckIcon className="size-3.5" />
              {Math.max(0, budgets.length - atRiskBudgets - exceededBudgets)} safe
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
