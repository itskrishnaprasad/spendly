import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import type { Account } from "@/types/base"
import type { UUID } from "@/types/primitives"
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from "@/utils/validations/category"

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

function handleDatabaseError(error: PostgrestError): ServiceError {
  if (error.code === "23505") {
    return {
      status: 409,
      message: "Account already exists.",
    }
  }

  if (error.code === "23503") {
    return {
      status: 409,
      message: "This account is in use and cannot be removed.",
    }
  }

  return {
    status: 500,
    message: error.message || "An unexpected database error occurred.",
  }
}

async function findAccountByName(
  supabase: SupabaseClient,
  userId: UUID,
  name: string,
  excludeId?: UUID
): Promise<ServiceResult<{ exists: boolean }>> {
  let query = supabase
    .from("accounts")
    .select("id,name")
    .eq("user_id", userId)
    .ilike("name", name)
    .limit(1)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: {
      exists: Boolean(data?.length),
    },
  }
}

export async function getAccounts(
  supabase: SupabaseClient,
  userId: UUID
): Promise<ServiceResult<Account[]>> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: (data ?? []) as Account[],
  }
}

export async function getAccountById(
  supabase: SupabaseClient,
  userId: UUID,
  accountId: UUID
): Promise<ServiceResult<Account>> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
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
        message: "Account not found.",
      },
    }
  }

  return {
    success: true,
    data: data as Account,
  }
}

export async function createAccount(
  supabase: SupabaseClient,
  userId: UUID,
  payload: CreateAccountInput
): Promise<ServiceResult<Account>> {
  const normalizedName = payload.name.trim()

  const duplicate = await findAccountByName(supabase, userId, normalizedName)

  if (!duplicate.success) {
    return duplicate as ServiceResult<Account>
  }

  if (duplicate.data.exists) {
    return {
      success: false,
      error: {
        status: 409,
        message: "Account with this name already exists.",
      },
    }
  }

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: normalizedName,
      type: payload.type,
      balance: payload.balance ?? 0,
      color: payload.color ?? null,
      icon: payload.icon ?? null,
      is_archived: payload.is_archived ?? false,
    })
    .select("*")
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: data as Account,
  }
}

export async function updateAccount(
  supabase: SupabaseClient,
  userId: UUID,
  accountId: UUID,
  payload: UpdateAccountInput
): Promise<ServiceResult<Account>> {
  const existing = await getAccountById(supabase, userId, accountId)

  if (!existing.success) {
    return existing
  }

  const updates: Record<string, unknown> = {
    ...payload,
    updated_at: new Date().toISOString(),
  }

  if (payload.name) {
    const normalizedName = payload.name.trim()

    const duplicate = await findAccountByName(
      supabase,
      userId,
      normalizedName,
      accountId
    )

    if (!duplicate.success) {
      return duplicate as ServiceResult<Account>
    }

    if (duplicate.data.exists) {
      return {
        success: false,
        error: {
          status: 409,
          message: "Account with this name already exists.",
        },
      }
    }

    updates.name = normalizedName
  }

  const { data, error } = await supabase
    .from("accounts")
    .update(updates)
    .eq("id", accountId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return {
    success: true,
    data: data as Account,
  }
}

export async function deleteAccount(
  supabase: SupabaseClient,
  userId: UUID,
  accountId: UUID
): Promise<ServiceResult<{ id: UUID }>> {
  const existing = await getAccountById(supabase, userId, accountId)

  if (!existing.success) {
    return existing as ServiceResult<{ id: UUID }>
  }

  const { data, error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
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
        message: "Account not found.",
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
