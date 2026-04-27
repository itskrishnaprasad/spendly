import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  endOfDay,
  format,
  isAfter,
  parseISO,
  startOfDay,
} from "date-fns"
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import type { BudgetPeriod } from "@/types/enums"
import type { UUID } from "@/types/primitives"
import type { BudgetProgress, BudgetWithRelations } from "@/types/budget"
import type {
  BudgetsQueryInput,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/utils/validations/budget"

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

type ExpenseTransactionRow = {
  amount: number | string | null
  account_id: UUID
  category_id: UUID
  transaction_date: string
}

function handleDatabaseError(error: PostgrestError): ServiceError {
  if (error.code === "23505") {
    return {
      status: 409,
      message: "Budget already exists.",
    }
  }

  if (error.code === "23503") {
    return {
      status: 409,
      message: "Referenced account or category was not found.",
    }
  }

  if (error.code === "PGRST116") {
    return {
      status: 404,
      message: "Budget not found.",
    }
  }

  return {
    status: 500,
    message: "An unexpected database error occurred.",
  }
}

function toNumeric(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0
  }

  const numeric = typeof value === "string" ? Number(value) : value

  return Number.isFinite(numeric) ? numeric : 0
}

function formatDate(value: Date) {
  return format(value, "yyyy-MM-dd")
}

function getPeriodWindow(period: BudgetPeriod, budgetStart: Date, now: Date) {
  if (isAfter(budgetStart, now)) {
    if (period === "weekly") {
      return {
        start: budgetStart,
        end: addDays(budgetStart, 6),
      }
    }

    if (period === "monthly") {
      return {
        start: budgetStart,
        end: addDays(addMonths(budgetStart, 1), -1),
      }
    }

    return {
      start: budgetStart,
      end: addDays(addYears(budgetStart, 1), -1),
    }
  }

  if (period === "weekly") {
    const days = differenceInCalendarDays(now, budgetStart)
    const fullWindows = Math.floor(days / 7)
    const start = addDays(budgetStart, fullWindows * 7)

    return {
      start,
      end: addDays(start, 6),
    }
  }

  if (period === "monthly") {
    const months = differenceInCalendarMonths(now, budgetStart)
    const fullWindows = Math.max(0, months)
    const start = addMonths(budgetStart, fullWindows)

    return {
      start,
      end: addDays(addMonths(start, 1), -1),
    }
  }

  const years = differenceInCalendarYears(now, budgetStart)
  const fullWindows = Math.max(0, years)
  const start = addYears(budgetStart, fullWindows)

  return {
    start,
    end: addDays(addYears(start, 1), -1),
  }
}

function getProgressWindow(row: BudgetWithRelations) {
  const now = startOfDay(new Date())
  const budgetStart = startOfDay(parseISO(row.start_date))
  const budgetEnd = row.end_date ? endOfDay(parseISO(row.end_date)) : null

  const periodWindow = getPeriodWindow(row.period, budgetStart, now)

  const effectiveStart = isAfter(budgetStart, periodWindow.start)
    ? budgetStart
    : periodWindow.start

  let effectiveEnd = periodWindow.end

  if (budgetEnd && isAfter(effectiveEnd, budgetEnd)) {
    effectiveEnd = budgetEnd
  }

  if (budgetEnd && isAfter(effectiveStart, budgetEnd)) {
    return {
      startDate: formatDate(budgetEnd),
      endDate: formatDate(budgetEnd),
      hasWindow: false,
    }
  }

  return {
    startDate: formatDate(effectiveStart),
    endDate: formatDate(effectiveEnd),
    hasWindow: true,
  }
}

function matchesBudgetScope(
  budget: BudgetWithRelations,
  tx: ExpenseTransactionRow
) {
  if (budget.category_id && tx.category_id !== budget.category_id) {
    return false
  }

  if (budget.account_id && tx.account_id !== budget.account_id) {
    return false
  }

  return true
}

async function ensureAccountOwnership(
  supabase: SupabaseClient,
  userId: UUID,
  accountId: UUID
) {
  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return {
      success: false as const,
      error: handleDatabaseError(error),
    }
  }

  if (!data) {
    return {
      success: false as const,
      error: {
        status: 404,
        message: "Account not found.",
      },
    }
  }

  return { success: true as const }
}

async function ensureCategoryOwnership(
  supabase: SupabaseClient,
  userId: UUID,
  categoryId: UUID
) {
  const ownedCategory = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle()

  if (ownedCategory.error) {
    return {
      success: false as const,
      error: handleDatabaseError(ownedCategory.error),
    }
  }

  if (ownedCategory.data) {
    return { success: true as const }
  }

  const defaultCategory = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .is("user_id", null)
    .eq("is_default", true)
    .maybeSingle()

  if (defaultCategory.error) {
    return {
      success: false as const,
      error: handleDatabaseError(defaultCategory.error),
    }
  }

  if (!defaultCategory.data) {
    return {
      success: false as const,
      error: {
        status: 404,
        message: "Category not found.",
      },
    }
  }

  return { success: true as const }
}

const BUDGET_SELECT = `
  id,
  user_id,
  category_id,
  account_id,
  name,
  amount,
  period,
  start_date,
  end_date,
  alert_percentage,
  is_active,
  created_at,
  updated_at,
  category:categories(id,name,color,icon,type),
  account:accounts(id,name,type,color,icon)
`

async function ensureBudgetAccess(
  supabase: SupabaseClient,
  userId: UUID,
  budgetId: UUID
): Promise<ServiceResult<BudgetWithRelations>> {
  const { data, error } = await supabase
    .from("budgets")
    .select(BUDGET_SELECT)
    .eq("id", budgetId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  if (!data) {
    return {
      success: false,
      error: {
        status: 404,
        message: "Budget not found.",
      },
    }
  }

  return {
    success: true,
    data: data as unknown as BudgetWithRelations,
  }
}

export async function getBudgets(
  supabase: SupabaseClient,
  userId: UUID,
  filters: BudgetsQueryInput
): Promise<ServiceResult<BudgetWithRelations[]>> {
  let query = supabase
    .from("budgets")
    .select(BUDGET_SELECT)
    .eq("user_id", userId)

  if (filters.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active)
  }

  if (filters.period) {
    query = query.eq("period", filters.period)
  }

  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id)
  }

  if (filters.account_id) {
    query = query.eq("account_id", filters.account_id)
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  })

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: (data ?? []) as unknown as BudgetWithRelations[],
  }
}

export async function getBudgetById(
  supabase: SupabaseClient,
  userId: UUID,
  budgetId: UUID
): Promise<ServiceResult<BudgetWithRelations>> {
  return ensureBudgetAccess(supabase, userId, budgetId)
}

export async function createBudget(
  supabase: SupabaseClient,
  userId: UUID,
  payload: CreateBudgetInput
): Promise<ServiceResult<BudgetWithRelations>> {
  if (payload.account_id) {
    const accountAccess = await ensureAccountOwnership(
      supabase,
      userId,
      payload.account_id
    )

    if (!accountAccess.success) {
      return accountAccess as ServiceResult<BudgetWithRelations>
    }
  }

  if (payload.category_id) {
    const categoryAccess = await ensureCategoryOwnership(
      supabase,
      userId,
      payload.category_id
    )

    if (!categoryAccess.success) {
      return categoryAccess as ServiceResult<BudgetWithRelations>
    }
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      category_id: payload.category_id ?? null,
      account_id: payload.account_id ?? null,
      name: payload.name.trim(),
      amount: payload.amount,
      period: payload.period,
      start_date: payload.start_date,
      end_date: payload.end_date ?? null,
      alert_percentage: payload.alert_percentage ?? null,
      is_active: payload.is_active ?? true,
    })
    .select(BUDGET_SELECT)
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: data as unknown as BudgetWithRelations,
  }
}

export async function updateBudget(
  supabase: SupabaseClient,
  userId: UUID,
  budgetId: UUID,
  payload: UpdateBudgetInput
): Promise<ServiceResult<BudgetWithRelations>> {
  const existing = await ensureBudgetAccess(supabase, userId, budgetId)

  if (!existing.success) {
    return existing
  }

  if (payload.account_id) {
    const accountAccess = await ensureAccountOwnership(
      supabase,
      userId,
      payload.account_id
    )

    if (!accountAccess.success) {
      return accountAccess as ServiceResult<BudgetWithRelations>
    }
  }

  if (payload.category_id) {
    const categoryAccess = await ensureCategoryOwnership(
      supabase,
      userId,
      payload.category_id
    )

    if (!categoryAccess.success) {
      return categoryAccess as ServiceResult<BudgetWithRelations>
    }
  }

  const nextStartDate = payload.start_date ?? existing.data.start_date
  const nextEndDate =
    payload.end_date === undefined ? existing.data.end_date : payload.end_date

  if (nextEndDate && nextEndDate < nextStartDate) {
    return {
      success: false,
      error: {
        status: 400,
        message: "End date must be on or after start date.",
      },
    }
  }

  const updates: Record<string, unknown> = {
    ...payload,
    updated_at: new Date().toISOString(),
  }

  if (payload.name) {
    updates.name = payload.name.trim()
  }

  if (payload.category_id === null) {
    updates.category_id = null
  }

  if (payload.account_id === null) {
    updates.account_id = null
  }

  if (payload.end_date === null) {
    updates.end_date = null
  }

  const { data, error } = await supabase
    .from("budgets")
    .update(updates)
    .eq("id", budgetId)
    .eq("user_id", userId)
    .select(BUDGET_SELECT)
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: data as unknown as BudgetWithRelations,
  }
}

export async function deleteBudget(
  supabase: SupabaseClient,
  userId: UUID,
  budgetId: UUID
): Promise<ServiceResult<{ id: UUID }>> {
  const existing = await ensureBudgetAccess(supabase, userId, budgetId)

  if (!existing.success) {
    return existing as ServiceResult<{ id: UUID }>
  }

  const { data, error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  if (!data) {
    return {
      success: false,
      error: {
        status: 404,
        message: "Budget not found.",
      },
    }
  }

  return {
    success: true,
    data: {
      id: data.id as UUID,
    },
  }
}

export async function getBudgetProgress(
  supabase: SupabaseClient,
  userId: UUID
): Promise<ServiceResult<BudgetProgress[]>> {
  const budgetsResponse = await supabase
    .from("budgets")
    .select(BUDGET_SELECT)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (budgetsResponse.error) {
    return {
      success: false,
      error: handleDatabaseError(budgetsResponse.error),
    }
  }

  const budgets = (budgetsResponse.data ?? []) as unknown as BudgetWithRelations[]

  if (!budgets.length) {
    return {
      success: true,
      data: [],
    }
  }

  const windows = budgets.map((budget) => ({
    budget,
    window: getProgressWindow(budget),
  }))

  const minStart = windows.map((item) => item.window.startDate).sort()[0]
  const maxEnd = windows
    .map((item) => item.window.endDate)
    .sort()
    .at(-1)

  let transactions: ExpenseTransactionRow[] = []

  if (minStart && maxEnd) {
    const txResponse = await supabase
      .from("transactions")
      .select("amount,account_id,category_id,transaction_date")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("transaction_date", minStart)
      .lte("transaction_date", maxEnd)

    if (txResponse.error) {
      return {
        success: false,
        error: handleDatabaseError(txResponse.error),
      }
    }

    transactions = (txResponse.data ?? []) as ExpenseTransactionRow[]
  }

  const progress = windows.map(({ budget, window }) => {
    const amount = toNumeric(budget.amount)

    const spent = window.hasWindow
      ? transactions.reduce((sum, tx) => {
          if (tx.transaction_date < window.startDate) {
            return sum
          }

          if (tx.transaction_date > window.endDate) {
            return sum
          }

          if (!matchesBudgetScope(budget, tx)) {
            return sum
          }

          return sum + toNumeric(tx.amount)
        }, 0)
      : 0

    const remaining = amount - spent
    const rawProgress = amount > 0 ? (spent / amount) * 100 : 0
    const progressPercentage = Number(rawProgress.toFixed(2))
    const alertThreshold = budget.alert_percentage ?? null

    return {
      id: budget.id,
      name: budget.name,
      period: budget.period,
      budget_amount: amount,
      spent_amount: spent,
      remaining_amount: Number(remaining.toFixed(2)),
      progress_percentage: progressPercentage,
      is_exceeded: spent > amount,
      is_alert_reached:
        alertThreshold !== null ? progressPercentage >= alertThreshold : false,
      start_date: budget.start_date,
      end_date: budget.end_date,
      period_start_date: window.startDate,
      period_end_date: window.endDate,
      category: budget.category,
      account: budget.account,
    } satisfies BudgetProgress
  })

  return {
    success: true,
    data: progress,
  }
}
