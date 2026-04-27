import {
  ArrowUpIcon,
  ArrowDownIcon,
  WalletIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Static mock data — no real data, purely illustrative
const summaryCards = [
  {
    label: "Total Balance",
    value: "$12,480.00",
    change: "+2.4%",
    positive: true,
    icon: WalletIcon,
  },
  {
    label: "Income",
    value: "$5,200.00",
    change: "This month",
    positive: true,
    icon: ArrowUpIcon,
  },
  {
    label: "Expenses",
    value: "$3,140.00",
    change: "-8.1%",
    positive: false,
    icon: ArrowDownIcon,
  },
  {
    label: "Savings Rate",
    value: "39.6%",
    change: "+4.2%",
    positive: true,
    icon: TrendingUpIcon,
  },
]

const recentTransactions = [
  { name: "Rent", category: "Housing", amount: "-$1,200", date: "Apr 1" },
  { name: "Salary", category: "Income", amount: "+$5,200", date: "Apr 1" },
  { name: "Groceries", category: "Food", amount: "-$84", date: "Apr 3" },
  { name: "Spotify", category: "Subscriptions", amount: "-$10", date: "Apr 4" },
]

const budgets = [
  { name: "Food & Dining", spent: 320, total: 500, pct: 64 },
  { name: "Transport", spent: 110, total: 200, pct: 55 },
  { name: "Entertainment", spent: 60, total: 150, pct: 40 },
]

export function DashboardPreview() {
  return (
    <section
      aria-label="Dashboard preview"
      className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-6"
    >
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
        {/* Faux window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-red-400/80" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-yellow-400/80" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-green-400/80" aria-hidden="true" />
          <span className="ml-2 text-[11px] text-muted-foreground/60 select-none">
            spendly — dashboard
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {summaryCards.map((card) => (
              <Card
                key={card.label}
                className="border-border/60 bg-background/60 p-3 shadow-none"
              >
                <CardHeader className="p-0 pb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {card.label}
                    </p>
                    <card.icon className="size-3 text-muted-foreground/60" aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-base font-semibold tracking-tight sm:text-lg">
                    {card.value}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-medium ${
                      card.positive ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {card.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* Recent Transactions */}
            <Card className="border-border/60 bg-background/60 shadow-none">
              <CardHeader className="px-3 py-2.5">
                <CardTitle className="text-xs font-semibold text-foreground">
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <Separator className="opacity-50" />
              <CardContent className="p-0">
                <ul role="list">
                  {recentTransactions.map((tx, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[9px] font-bold">
                          {tx.name[0]}
                        </span>
                        <div>
                          <p className="font-medium leading-none text-foreground">
                            {tx.name}
                          </p>
                          <p className="text-muted-foreground">{tx.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.amount.startsWith("+")
                              ? "text-emerald-500"
                              : "text-foreground"
                          }`}
                        >
                          {tx.amount}
                        </p>
                        <p className="text-muted-foreground">{tx.date}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Budget Tracker */}
            <Card className="border-border/60 bg-background/60 shadow-none">
              <CardHeader className="px-3 py-2.5">
                <CardTitle className="text-xs font-semibold text-foreground">
                  Budget Tracker
                </CardTitle>
              </CardHeader>
              <Separator className="opacity-50" />
              <CardContent className="space-y-3 p-3">
                {budgets.map((b) => (
                  <div key={b.name}>
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-foreground">
                        {b.name}
                      </span>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          ${b.spent}
                        </span>{" "}
                        / ${b.total}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={b.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${b.name} budget`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <div className="mt-0.5 text-right text-[9px] text-muted-foreground">
                      {b.pct}% used
                    </div>
                  </div>
                ))}

                <div className="mt-1 flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2">
                  <div>
                    <p className="text-[10px] font-medium text-foreground">
                      Remaining budget
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Across all categories
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    $480 left
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
