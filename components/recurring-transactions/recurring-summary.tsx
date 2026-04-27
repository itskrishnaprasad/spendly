import {
  AlertTriangleIcon,
  CircleCheckIcon,
  RepeatIcon,
  TimerIcon,
} from "lucide-react"

import type { RecurringTransactionWithRelations } from "@/types/recurring-transaction"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

interface RecurringSummaryProps {
  recurringTransactions: RecurringTransactionWithRelations[]
}

export function RecurringSummary({ recurringTransactions }: RecurringSummaryProps) {
  const totalIncome = recurringTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpense = recurringTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const activeRecurring = recurringTransactions.filter(
    (item) => item.is_active !== false
  ).length
  const upcomingScheduled = recurringTransactions.filter(
    (item) => item.is_active !== false
  ).length

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Recurring Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-primary">{formatCurrency(totalIncome)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <RepeatIcon className="size-3.5" />
            Automated inflows
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Recurring Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-destructive">{formatCurrency(totalExpense)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangleIcon className="size-3.5" />
            Automated outflows
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Active Automations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{activeRecurring}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CircleCheckIcon className="size-3.5" />
            Enabled schedules
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Upcoming Scheduled Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{upcomingScheduled}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <TimerIcon className="size-3.5" />
            Automation queue
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
