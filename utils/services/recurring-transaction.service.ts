import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  parseISO,
} from "date-fns"
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import type { Account, Category } from "@/types/base"
import type {
  ProcessRecurringTransactionResult,
  RecurringTransaction,
  RecurringTransactionWithRelations,
} from "@/types/recurring-transaction"
import type { RecurringFrequency } from "@/types/enums"
import type { UUID } from "@/types/primitives"
import type {
  CreateRecurringTransactionInput,
  RecurringTransactionQueryInput,
  UpdateRecurringTransactionInput,
} from "@/utils/validations/recurring-transaction"

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

type ProcessingRow = {
  id: UUID
  user_id: UUID
  account_id: UUID
  category_id: UUID
  type: "income" | "expense"
  amount: number | string | null
  title: string
  note: string | null
  frequency: RecurringFrequency
  interval_count: number | null
  start_date: string
  end_date: string | null
  next_run_date: string
  last_run_date: string | null
  is_active: boolean | null
}

type ProcessingAccountRow = {
  id: UUID
  user_id: UUID
  balance: number | string | null
}

function handleDatabaseError(error: PostgrestError): ServiceError {
  if (error.code === "23505") {
    return {
      status: 409,
      message: "Recurring transaction already exists.",
    }
  }

  if (error.code === "23503") {
    return {
      status: 409,
      message: "Referenced account or category was not found.",
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

export function calculateNextRunDate(
  currentRunDate: string,
  frequency: RecurringFrequency,
  intervalCount: number
) {
  const safeInterval = Math.max(1, intervalCount)
  const currentDate = parseISO(currentRunDate)

  if (frequency === "daily") {
    return formatDate(addDays(currentDate, safeInterval))
  }

  if (frequency === "weekly") {
    return formatDate(addWeeks(currentDate, safeInterval))
  }

  if (frequency === "monthly") {
    return formatDate(addMonths(currentDate, safeInterval))
  }

  return formatDate(addYears(currentDate, safeInterval))
}

const RECURRING_SELECT = `
	id,
	user_id,
	account_id,
	category_id,
	type,
	amount,
	title,
	note,
	frequency,
	interval_count,
	start_date,
	end_date,
	next_run_date,
	last_run_date,
	is_active,
	created_at,
	updated_at,
	account:accounts(id,name,type,color,icon),
	category:categories(id,name,slug,type,color,icon)
`

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

async function ensureRecurringTransactionAccess(
  supabase: SupabaseClient,
  userId: UUID,
  recurringTransactionId: UUID
): Promise<ServiceResult<RecurringTransactionWithRelations>> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select(RECURRING_SELECT)
    .eq("id", recurringTransactionId)
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
        message: "Recurring transaction not found.",
      },
    }
  }

  return {
    success: true,
    data: data as unknown as RecurringTransactionWithRelations,
  }
}

export async function getRecurringTransactions(
  supabase: SupabaseClient,
  userId: UUID,
  filters: RecurringTransactionQueryInput
): Promise<ServiceResult<RecurringTransactionWithRelations[]>> {
  let query = supabase
    .from("recurring_transactions")
    .select(RECURRING_SELECT)
    .eq("user_id", userId)

  if (filters.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active)
  }

  if (filters.frequency) {
    query = query.eq("frequency", filters.frequency)
  }

  if (filters.type) {
    query = query.eq("type", filters.type)
  }

  const { data, error } = await query.order("next_run_date", {
    ascending: true,
  })

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: (data ?? []) as unknown as RecurringTransactionWithRelations[],
  }
}

export async function getRecurringTransactionById(
  supabase: SupabaseClient,
  userId: UUID,
  recurringTransactionId: UUID
): Promise<ServiceResult<RecurringTransactionWithRelations>> {
  return ensureRecurringTransactionAccess(
    supabase,
    userId,
    recurringTransactionId
  )
}

export async function createRecurringTransaction(
  supabase: SupabaseClient,
  userId: UUID,
  payload: CreateRecurringTransactionInput
): Promise<ServiceResult<RecurringTransactionWithRelations>> {
  const accountAccess = await ensureAccountOwnership(
    supabase,
    userId,
    payload.account_id
  )

  if (!accountAccess.success) {
    return accountAccess as ServiceResult<RecurringTransactionWithRelations>
  }

  const categoryAccess = await ensureCategoryOwnership(
    supabase,
    userId,
    payload.category_id
  )

  if (!categoryAccess.success) {
    return categoryAccess as ServiceResult<RecurringTransactionWithRelations>
  }

  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({
      user_id: userId,
      account_id: payload.account_id,
      category_id: payload.category_id,
      type: payload.type,
      amount: payload.amount,
      title: payload.title.trim(),
      note: payload.note?.trim() || null,
      frequency: payload.frequency,
      interval_count: payload.interval_count ?? 1,
      start_date: payload.start_date,
      end_date: payload.end_date ?? null,
      next_run_date: payload.start_date,
      last_run_date: null,
      is_active: payload.is_active ?? true,
    })
    .select(RECURRING_SELECT)
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: data as unknown as RecurringTransactionWithRelations,
  }
}

export async function updateRecurringTransaction(
  supabase: SupabaseClient,
  userId: UUID,
  recurringTransactionId: UUID,
  payload: UpdateRecurringTransactionInput
): Promise<ServiceResult<RecurringTransactionWithRelations>> {
  const existing = await ensureRecurringTransactionAccess(
    supabase,
    userId,
    recurringTransactionId
  )

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
      return accountAccess as ServiceResult<RecurringTransactionWithRelations>
    }
  }

  if (payload.category_id) {
    const categoryAccess = await ensureCategoryOwnership(
      supabase,
      userId,
      payload.category_id
    )

    if (!categoryAccess.success) {
      return categoryAccess as ServiceResult<RecurringTransactionWithRelations>
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

  if (payload.title) {
    updates.title = payload.title.trim()
  }

  if (payload.note !== undefined) {
    updates.note = payload.note?.trim() || null
  }

  if (payload.start_date || payload.frequency || payload.interval_count) {
    const lastRunDate = existing.data.last_run_date
    const baseRunDate =
      lastRunDate ?? payload.start_date ?? existing.data.start_date
    const frequency = payload.frequency ?? existing.data.frequency
    const intervalCount =
      payload.interval_count ?? existing.data.interval_count ?? 1

    updates.next_run_date = lastRunDate
      ? calculateNextRunDate(baseRunDate, frequency, intervalCount)
      : baseRunDate
  }

  if (payload.end_date === null) {
    updates.end_date = null
  }

  const { data, error } = await supabase
    .from("recurring_transactions")
    .update(updates)
    .eq("id", recurringTransactionId)
    .eq("user_id", userId)
    .select(RECURRING_SELECT)
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: data as unknown as RecurringTransactionWithRelations,
  }
}

export async function deleteRecurringTransaction(
  supabase: SupabaseClient,
  userId: UUID,
  recurringTransactionId: UUID
): Promise<ServiceResult<{ id: UUID }>> {
  const existing = await ensureRecurringTransactionAccess(
    supabase,
    userId,
    recurringTransactionId
  )

  if (!existing.success) {
    return existing as ServiceResult<{ id: UUID }>
  }

  const { data, error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", recurringTransactionId)
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
        message: "Recurring transaction not found.",
      },
    }
  }

  return {
    success: true,
    data: { id: data.id as UUID },
  }
}

export async function processRecurringTransactions(
  supabase: SupabaseClient,
  processDate?: string
): Promise<ServiceResult<ProcessRecurringTransactionResult>> {
  const today = processDate ?? formatDate(new Date())

  const dueRecurringResponse = await supabase
    .from("recurring_transactions")
    .select(
      "id,user_id,account_id,category_id,type,amount,title,note,frequency,interval_count,start_date,end_date,next_run_date,last_run_date,is_active"
    )
    .eq("is_active", true)
    .lte("next_run_date", today)

  if (dueRecurringResponse.error) {
    return {
      success: false,
      error: handleDatabaseError(dueRecurringResponse.error),
    }
  }

  const dueRecurring = (dueRecurringResponse.data ?? []) as ProcessingRow[]

  if (!dueRecurring.length) {
    return {
      success: true,
      data: {
        processed_count: 0,
        created_transactions: 0,
        skipped_count: 0,
        failed_count: 0,
      },
    }
  }

  const accountIds = Array.from(
    new Set(dueRecurring.map((item) => item.account_id))
  )

  const accountsResponse = await supabase
    .from("accounts")
    .select("id,user_id,balance")
    .in("id", accountIds)

  if (accountsResponse.error) {
    return {
      success: false,
      error: handleDatabaseError(accountsResponse.error),
    }
  }

  const accountMap = new Map<UUID, ProcessingAccountRow>(
    ((accountsResponse.data ?? []) as ProcessingAccountRow[]).map((account) => [
      account.id,
      account,
    ])
  )

  let processedCount = 0
  let createdTransactions = 0
  let skippedCount = 0
  let failedCount = 0

  for (const recurring of dueRecurring) {
    if (recurring.end_date && recurring.next_run_date > recurring.end_date) {
      skippedCount += 1
      continue
    }

    const account = accountMap.get(recurring.account_id)

    if (!account || account.user_id !== recurring.user_id) {
      failedCount += 1
      continue
    }

    const amount = toNumeric(recurring.amount)
    const currentBalance = toNumeric(account.balance)
    const nextBalance =
      recurring.type === "income"
        ? currentBalance + amount
        : currentBalance - amount

    const nextRunDate = calculateNextRunDate(
      recurring.next_run_date,
      recurring.frequency,
      recurring.interval_count ?? 1
    )

    const shouldDeactivate =
      recurring.end_date !== null && nextRunDate > recurring.end_date

    const transactionInsert = await supabase
      .from("transactions")
      .insert({
        user_id: recurring.user_id,
        account_id: recurring.account_id,
        category_id: recurring.category_id,
        type: recurring.type,
        amount,
        title: recurring.title,
        note: recurring.note,
        transaction_date: recurring.next_run_date,
        is_recurring: true,
        recurring_transaction_id: recurring.id,
      })
      .select("id")
      .single()

    if (transactionInsert.error) {
      failedCount += 1
      continue
    }

    const createdTransactionId = transactionInsert.data.id as UUID

    const accountUpdate = await supabase
      .from("accounts")
      .update({
        balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recurring.account_id)
      .eq("user_id", recurring.user_id)
      .select("id")
      .maybeSingle()

    if (accountUpdate.error || !accountUpdate.data) {
      await supabase
        .from("transactions")
        .delete()
        .eq("id", createdTransactionId)
      failedCount += 1
      continue
    }

    const recurringUpdate = await supabase
      .from("recurring_transactions")
      .update({
        last_run_date: recurring.next_run_date,
        next_run_date: nextRunDate,
        is_active: shouldDeactivate ? false : recurring.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recurring.id)
      .eq("user_id", recurring.user_id)
      .select("id")
      .maybeSingle()

    if (recurringUpdate.error || !recurringUpdate.data) {
      await supabase
        .from("accounts")
        .update({
          balance: currentBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recurring.account_id)
        .eq("user_id", recurring.user_id)
      await supabase
        .from("transactions")
        .delete()
        .eq("id", createdTransactionId)
      failedCount += 1
      continue
    }

    accountMap.set(recurring.account_id, {
      ...account,
      balance: nextBalance,
    })

    processedCount += 1
    createdTransactions += 1
  }

  return {
    success: true,
    data: {
      processed_count: processedCount,
      created_transactions: createdTransactions,
      skipped_count: skippedCount,
      failed_count: failedCount,
    },
  }
}
