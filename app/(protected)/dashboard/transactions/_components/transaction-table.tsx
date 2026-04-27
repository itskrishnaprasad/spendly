"use client"

import { RepeatIcon } from "lucide-react"

import type { Account, Category, Transaction } from "@/types/base"
import type { TransactionType } from "@/types/enums"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { TransactionRowActions } from "./transaction-row-actions"

function formatCurrency(value: number | string | null) {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0

  if (Number.isNaN(numeric)) {
    return "$0.00"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric)
}

function formatDate(value: string | null) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

function getTransactionIcon(type: TransactionType) {
  return type === "income" ? (
    <span className="text-primary">↑</span>
  ) : (
    <span className="text-destructive">↓</span>
  )
}

export function TransactionTable({
  items,
  accounts,
  categories,
  onTransactionChanged,
}: {
  items: Transaction[]
  accounts: Account[]
  categories: Category[]
  onTransactionChanged: () => void
}) {
  const accountMap = new Map(accounts.map((account) => [account.id, account.name]))
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]))

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="hidden xl:table-cell">Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="max-w-[16rem]">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted"
                    aria-hidden="true"
                  >
                    {getTransactionIcon(transaction.type)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{transaction.title}</p>
                    {transaction.is_recurring ? (
                      <Badge variant="outline" className="mt-1 gap-1">
                        <RepeatIcon className="size-3" />
                        Recurring
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                  {transaction.type === "income" ? "Income" : "Expense"}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "font-medium",
                    transaction.type === "income"
                      ? "text-primary"
                      : "text-destructive"
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>
              </TableCell>
              <TableCell>{accountMap.get(transaction.account_id) ?? transaction.account_id}</TableCell>
              <TableCell>{categoryMap.get(transaction.category_id) ?? transaction.category_id}</TableCell>
              <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
              <TableCell className="hidden max-w-[18rem] truncate xl:table-cell">
                {transaction.note || "-"}
              </TableCell>
              <TableCell className="text-right">
                <TransactionRowActions
                  transaction={transaction}
                  accounts={accounts}
                  categories={categories}
                  onTransactionChanged={onTransactionChanged}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
