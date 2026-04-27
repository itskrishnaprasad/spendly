import { ArrowDownRightIcon, ArrowUpRightIcon, PiggyBankIcon, WalletIcon } from "lucide-react"

import type { DashboardSummary } from "@/types/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { formatCurrency } from "./dashboard-utils"

type SummaryCardsProps = {
  data: DashboardSummary | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

const cards = [
  {
    key: "total_balance",
    title: "Total Balance",
    description: "Across all connected accounts",
    icon: WalletIcon,
    accent: "text-primary",
  },
  {
    key: "total_income",
    title: "Total Income",
    description: "All income transactions",
    icon: ArrowUpRightIcon,
    accent: "text-primary",
  },
  {
    key: "total_expense",
    title: "Total Expense",
    description: "All expense transactions",
    icon: ArrowDownRightIcon,
    accent: "text-destructive",
  },
  {
    key: "savings",
    title: "Savings",
    description: "Income minus expense",
    icon: PiggyBankIcon,
    accent: "text-chart-2",
  },
] as const

function SummaryCardSkeleton() {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-32" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  )
}

export function SummaryCards({ data, loading, error, onRetry }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SummaryCardSkeleton key={card.key} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle>Unable to load summary</CardTitle>
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

  if (!data) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = data[card.key]

        return (
          <Card
            key={card.key}
            className="group border-border/60 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardDescription>{card.title}</CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-tight">
                    {formatCurrency(value)}
                  </CardTitle>
                </div>
                <div className={`rounded-xl border bg-muted/40 p-3 ${card.accent}`}>
                  <Icon className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
