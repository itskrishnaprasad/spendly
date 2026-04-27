import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"

import type { DashboardExpenseCategoryBreakdown } from "@/types/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { formatCurrency } from "./dashboard-utils"

type ExpenseCategoryChartProps = {
  data: DashboardExpenseCategoryBreakdown[] | null
  loading: boolean
  error: string | null
}

const FALLBACK_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

function ExpenseCategorySkeleton() {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </CardContent>
    </Card>
  )
}

export function ExpenseCategoryChart({
  data,
  loading,
  error,
}: ExpenseCategoryChartProps) {
  if (loading) {
    return <ExpenseCategorySkeleton />
  }

  if (error) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle>Expense by category</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        {onRetry ? (
          <CardContent className="pt-0">
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </CardContent>
        ) : null}
      </Card>
    )
  }

  const chartData = (data ?? []).map((item, index) => ({
    ...item,
    fill: item.category_color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }))

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <CardTitle>Expense by category</CardTitle>
        <CardDescription>
          Category spend distribution for the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <ChartContainer
            config={{}}
            className="mx-auto h-[280px] w-full max-w-[340px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="category_name"
                innerRadius={78}
                outerRadius={112}
                strokeWidth={4}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.category_id} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="space-y-3">
            {chartData.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                No expense transactions were found for this period.
              </div>
            ) : (
              chartData.map((item, index) => (
                <div
                  key={item.category_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.category_name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(item.total)}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      Expense
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
