import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import type { DashboardMonthlyOverviewItem } from "@/types/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type MonthlyOverviewChartProps = {
  data: DashboardMonthlyOverviewItem[] | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--color-chart-1)",
  },
  expense: {
    label: "Expense",
    color: "var(--color-chart-2)",
  },
  savings: {
    label: "Savings",
    color: "var(--color-chart-3)",
  },
} as const

function MonthlyOverviewSkeleton() {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </CardContent>
    </Card>
  )
}

export function MonthlyOverviewChart({
  data,
  loading,
  error,
}: MonthlyOverviewChartProps) {
  if (loading) {
    return <MonthlyOverviewSkeleton />
  }

  if (error) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle>Monthly overview</CardTitle>
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

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <CardTitle>Monthly overview</CardTitle>
        <CardDescription>
          Income, expenses, and savings across the last 12 months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart data={data ?? []} margin={{ left: 4, right: 16, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={56}
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(Number(value))
              }
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="var(--color-income)"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="var(--color-expense)"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="var(--color-savings)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
