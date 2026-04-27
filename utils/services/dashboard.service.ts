import { endOfMonth, format, startOfMonth, subMonths } from "date-fns"
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import type {
  DashboardExpenseCategoryBreakdown,
  DashboardMonthlyOverviewItem,
  DashboardRecentTransaction,
  DashboardSummary,
} from "@/types/dashboard"
import type { Account, Category } from "@/types/base"
import type { UUID } from "@/types/primitives"

type ServiceError = {
  status: number
  message: string
  errors?: unknown
}

type ServiceResult<T> =
  | {
      success: true
      data: T
      error?: never
    }
  | {
      success: false
      data?: never
      error: ServiceError
    }

type TransactionSummaryRow = {
  amount: number | string | null
  type: "income" | "expense"
}

type MonthlyTransactionRow = {
  amount: number | string | null
  type: "income" | "expense"
  transaction_date: string
}

type ExpenseByCategoryRow = {
  amount: number | string | null
  category_id: UUID
  category: Pick<Category, "id" | "name" | "color"> | null
}

function handleDatabaseError(error: PostgrestError): ServiceError {
  if (error.code === "PGRST116") {
    return {
      status: 404,
      message: "Requested dashboard data was not found.",
    }
  }

  return {
    status: 500,
    message: error.message || "An unexpected database error occurred.",
  }
}

function toNumeric(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0
  }

  const numeric = typeof value === "string" ? Number(value) : value

  return Number.isFinite(numeric) ? numeric : 0
}

function toIsoDate(value: Date) {
  return format(value, "yyyy-MM-dd")
}

function buildLastTwelveMonths() {
  const currentMonth = startOfMonth(new Date())

  return Array.from({ length: 12 }, (_, index) =>
    startOfMonth(subMonths(currentMonth, 11 - index))
  )
}

function emptySummary(): DashboardSummary {
  return {
    total_balance: 0,
    total_income: 0,
    total_expense: 0,
    savings: 0,
  }
}

function mapRecentTransaction(
  row: DashboardRecentTransaction
): DashboardRecentTransaction {
  return row
}

export async function getDashboardSummary(
  supabase: SupabaseClient,
  userId: UUID
): Promise<ServiceResult<DashboardSummary>> {
  const [accountsResponse, transactionsResponse] = await Promise.all([
    supabase.from("accounts").select("balance").eq("user_id", userId),
    supabase.from("transactions").select("amount,type").eq("user_id", userId),
  ])

  if (accountsResponse.error) {
    return {
      success: false,
      error: handleDatabaseError(accountsResponse.error),
    }
  }

  if (transactionsResponse.error) {
    return {
      success: false,
      error: handleDatabaseError(transactionsResponse.error),
    }
  }

  const totalBalance = (accountsResponse.data ?? []).reduce(
    (sum: number, account: Pick<Account, "balance">) =>
      sum + toNumeric(account.balance),
    0
  )

  const summary = (transactionsResponse.data ?? []).reduce(
    (accumulator: DashboardSummary, transaction: TransactionSummaryRow) => {
      const amount = toNumeric(transaction.amount)

      if (transaction.type === "income") {
        accumulator.total_income += amount
      } else {
        accumulator.total_expense += amount
      }

      return accumulator
    },
    emptySummary()
  )

  return {
    success: true,
    data: {
      total_balance: totalBalance,
      total_income: summary.total_income,
      total_expense: summary.total_expense,
      savings: summary.total_income - summary.total_expense,
    },
  }
}

export async function getMonthlyOverview(
  supabase: SupabaseClient,
  userId: UUID
): Promise<ServiceResult<DashboardMonthlyOverviewItem[]>> {
  const monthBuckets = buildLastTwelveMonths().map((monthDate) => ({
    key: format(monthDate, "yyyy-MM"),
    item: {
      month: format(monthDate, "MMM"),
      income: 0,
      expense: 0,
      savings: 0,
    } satisfies DashboardMonthlyOverviewItem,
  }))

  const firstMonth =
    monthBuckets[0]?.key ?? format(startOfMonth(new Date()), "yyyy-MM")
  const lastMonthDate = endOfMonth(new Date())

  const { data, error } = await supabase
    .from("transactions")
    .select("amount,type,transaction_date")
    .eq("user_id", userId)
    .gte("transaction_date", `${firstMonth}-01`)
    .lte("transaction_date", toIsoDate(lastMonthDate))

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  const byMonth = new Map(
    monthBuckets.map(({ key, item }) => [key, { ...item }])
  )

  for (const row of (data ?? []) as MonthlyTransactionRow[]) {
    const monthKey = format(
      new Date(`${row.transaction_date}T00:00:00`),
      "yyyy-MM"
    )
    const bucket = byMonth.get(monthKey)

    if (!bucket) {
      continue
    }

    const amount = toNumeric(row.amount)

    if (row.type === "income") {
      bucket.income += amount
    } else {
      bucket.expense += amount
    }

    bucket.savings = bucket.income - bucket.expense
  }

  return {
    success: true,
    data: Array.from(byMonth.entries()).map(([, item]) => item),
  }
}

export async function getExpenseByCategory(
  supabase: SupabaseClient,
  userId: UUID
): Promise<ServiceResult<DashboardExpenseCategoryBreakdown[]>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("amount,category_id,category:categories(id,name,color)")
    .eq("user_id", userId)
    .eq("type", "expense")

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  const grouped = new Map<
    UUID,
    DashboardExpenseCategoryBreakdown & { sortTotal: number }
  >()

  for (const row of (data ?? []) as unknown as ExpenseByCategoryRow[]) {
    const category = row.category

    if (!category) {
      continue
    }

    const amount = toNumeric(row.amount)
    const existing = grouped.get(row.category_id)

    if (existing) {
      existing.total += amount
      existing.sortTotal += amount
      continue
    }

    grouped.set(row.category_id, {
      category_id: row.category_id,
      category_name: category.name,
      category_color: category.color ?? null,
      total: amount,
      sortTotal: amount,
    })
  }

  return {
    success: true,
    data: Array.from(grouped.values())
      .sort((left, right) => right.sortTotal - left.sortTotal)
      .map(({ sortTotal: _sortTotal, ...item }) => item),
  }
}

export async function getRecentTransactions(
  supabase: SupabaseClient,
  userId: UUID
): Promise<ServiceResult<DashboardRecentTransaction[]>> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
        id,
        user_id,
        account_id,
        category_id,
        type,
        amount,
        title,
        note,
        transaction_date,
        is_recurring,
        recurring_transaction_id,
        created_at,
        updated_at,
        account:accounts(id,name,type,color,icon),
        category:categories(id,name,slug,type,color,icon)
      `
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: (data ?? []).map((row) =>
      mapRecentTransaction(row as unknown as DashboardRecentTransaction)
    ),
  }
}
