import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"

import type { DashboardRecentTransaction } from "@/types/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { formatCurrency, formatDate } from "./dashboard-utils"

type RecentTransactionsProps = {
  data: DashboardRecentTransaction[] | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

function RecentTransactionsSkeleton() {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RecentTransactions({ data, loading, error, onRetry }: RecentTransactionsProps) {
  if (loading) {
    return <RecentTransactionsSkeleton />
  }

  if (error) {
    return (
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
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
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>
          The latest activity across your accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((transaction) => {
                const isIncome = transaction.type === "income"

                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-9 items-center justify-center rounded-full border ${
                            isIncome
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-destructive/20 bg-destructive/10 text-destructive"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRightIcon className="size-4" />
                          ) : (
                            <ArrowDownRightIcon className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{transaction.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {transaction.note || transaction.category.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category.name}</Badge>
                    </TableCell>
                    <TableCell>{transaction.account.name}</TableCell>
                    <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          isIncome
                            ? "font-semibold text-primary"
                            : "font-semibold text-destructive"
                        }
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
            No transactions available yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
