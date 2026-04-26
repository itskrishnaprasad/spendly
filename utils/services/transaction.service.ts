import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import type { Transaction } from "@/types/base"
import type { UUID } from "@/types/primitives"
import type {
  CreateTransactionInput,
  TransactionQueryInput,
  UpdateTransactionInput,
} from "@/utils/validations/transactions"

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

type TransactionsPage = {
  items: Transaction[]
  page: number
  limit: number
  total: number
  total_pages: number
}

function handleDatabaseError(error: PostgrestError): ServiceError {
  if (error.code === "23505") {
    return {
      status: 409,
      message: "Transaction already exists.",
    }
  }

  if (error.code === "23503") {
    return {
      status: 409,
      message:
        "Referenced account, category, or recurring transaction was not found.",
    }
  }

  return {
    status: 500,
    message: error.message || "An unexpected database error occurred.",
  }
}

function parseDateRange(value: string) {
  return value
}

async function ensureOwnership(
  supabase: SupabaseClient,
  userId: UUID,
  table: "accounts" | "categories" | "recurring_transactions",
  id: UUID
) {
  if (table === "categories") {
    const ownedCategory = await supabase
      .from("categories")
      .select("id")
      .eq("id", id)
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
      .eq("id", id)
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

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
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
        message: `${table.replaceAll("_", " ")} not found.`,
      },
    }
  }

  return { success: true as const }
}

async function ensureTransactionAccess(
  supabase: SupabaseClient,
  userId: UUID,
  transactionId: UUID
): Promise<ServiceResult<Transaction>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
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
        message: "Transaction not found.",
      },
    }
  }

  return { success: true, data: data as Transaction }
}

export async function getTransactions(
  supabase: SupabaseClient,
  userId: UUID,
  query: TransactionQueryInput
): Promise<ServiceResult<TransactionsPage>> {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  let dbQuery = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)

  if (query.type) {
    dbQuery = dbQuery.eq("type", query.type)
  }

  if (query.category_id) {
    dbQuery = dbQuery.eq("category_id", query.category_id)
  }

  if (query.account_id) {
    dbQuery = dbQuery.eq("account_id", query.account_id)
  }

  if (query.from) {
    dbQuery = dbQuery.gte("transaction_date", parseDateRange(query.from))
  }

  if (query.to) {
    dbQuery = dbQuery.lte("transaction_date", parseDateRange(query.to))
  }

  if (query.search) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query.search}%,note.ilike.%${query.search}%`
    )
  }

  const { data, error, count } = await dbQuery
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  const total = count ?? 0

  return {
    success: true,
    data: {
      items: (data ?? []) as Transaction[],
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getTransactionById(
  supabase: SupabaseClient,
  userId: UUID,
  transactionId: UUID
): Promise<ServiceResult<Transaction>> {
  return ensureTransactionAccess(supabase, userId, transactionId)
}

export async function createTransaction(
  supabase: SupabaseClient,
  userId: UUID,
  payload: CreateTransactionInput
): Promise<ServiceResult<Transaction>> {
  const accountAccess = await ensureOwnership(
    supabase,
    userId,
    "accounts",
    payload.account_id
  )
  if (!accountAccess.success) return accountAccess as ServiceResult<Transaction>

  const categoryAccess = await ensureOwnership(
    supabase,
    userId,
    "categories",
    payload.category_id
  )
  if (!categoryAccess.success)
    return categoryAccess as ServiceResult<Transaction>

  if (payload.recurring_transaction_id) {
    const recurringAccess = await ensureOwnership(
      supabase,
      userId,
      "recurring_transactions",
      payload.recurring_transaction_id
    )
    if (!recurringAccess.success)
      return recurringAccess as ServiceResult<Transaction>
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      account_id: payload.account_id,
      category_id: payload.category_id,
      type: payload.type,
      amount: payload.amount,
      title: payload.title.trim(),
      note: payload.note?.trim() || null,
      transaction_date: payload.transaction_date,
      is_recurring: payload.is_recurring ?? false,
      recurring_transaction_id: payload.recurring_transaction_id ?? null,
    })
    .select("*")
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return { success: true, data: data as Transaction }
}

export async function updateTransaction(
  supabase: SupabaseClient,
  userId: UUID,
  transactionId: UUID,
  payload: UpdateTransactionInput
): Promise<ServiceResult<Transaction>> {
  const existing = await ensureTransactionAccess(
    supabase,
    userId,
    transactionId
  )
  if (!existing.success) return existing

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

  if (payload.account_id) {
    const accountAccess = await ensureOwnership(
      supabase,
      userId,
      "accounts",
      payload.account_id
    )
    if (!accountAccess.success)
      return accountAccess as ServiceResult<Transaction>
  }

  if (payload.category_id) {
    const categoryAccess = await ensureOwnership(
      supabase,
      userId,
      "categories",
      payload.category_id
    )
    if (!categoryAccess.success)
      return categoryAccess as ServiceResult<Transaction>
  }

  if (payload.recurring_transaction_id) {
    const recurringAccess = await ensureOwnership(
      supabase,
      userId,
      "recurring_transactions",
      payload.recurring_transaction_id
    )
    if (!recurringAccess.success)
      return recurringAccess as ServiceResult<Transaction>
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", transactionId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return { success: true, data: data as Transaction }
}

export async function deleteTransaction(
  supabase: SupabaseClient,
  userId: UUID,
  transactionId: UUID
): Promise<ServiceResult<{ id: UUID }>> {
  const existing = await ensureTransactionAccess(
    supabase,
    userId,
    transactionId
  )
  if (!existing.success) return existing as ServiceResult<{ id: UUID }>

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
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
        message: "Transaction not found.",
      },
    }
  }

  return { success: true, data: { id: data.id as UUID } }
}
