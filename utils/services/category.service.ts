import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import type { Category } from "@/types/base"
import type { TransactionType } from "@/types/enums"
import type { UUID } from "@/types/primitives"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
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

function toKebabCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function handleDatabaseError(error: PostgrestError): ServiceError {
  if (error.code === "23505") {
    return {
      status: 409,
      message: "Category already exists.",
    }
  }

  if (error.code === "23503") {
    return {
      status: 409,
      message: "This category is in use and cannot be removed.",
    }
  }

  if (error.code === "42703") {
    return {
      status: 500,
      message: "Category schema mismatch. Please contact support.",
    }
  }

  return {
    status: 500,
    message: error.message || "An unexpected database error occurred.",
  }
}

function canAccessCategory(category: Category, userId: UUID) {
  if (category.is_default && category.user_id === null) {
    return true
  }

  return category.user_id === userId
}

async function findCategoryByName(
  supabase: SupabaseClient,
  userId: UUID,
  name: string,
  excludeId?: UUID
): Promise<ServiceResult<{ exists: boolean }>> {
  let query = supabase
    .from("categories")
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

export async function getCategoriesByType(
  supabase: SupabaseClient,
  userId: UUID,
  type: TransactionType
): Promise<ServiceResult<Category[]>> {
  const defaultQuery = supabase
    .from("categories")
    .select("*")
    .is("user_id", null)
    .eq("type", type)
    .eq("is_default", true)

  const customQuery = supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("is_default", false)

  const [
    { data: defaultCategories, error: defaultError },
    { data: customCategories, error: customError },
  ] = await Promise.all([defaultQuery, customQuery])

  if (defaultError) {
    return { success: false, error: handleDatabaseError(defaultError) }
  }

  if (customError) {
    return { success: false, error: handleDatabaseError(customError) }
  }

  const merged = [
    ...(defaultCategories ?? []),
    ...(customCategories ?? []),
  ] as Category[]

  merged.sort((a, b) => {
    const aTime = a.created_at
      ? new Date(a.created_at).getTime()
      : Number.MAX_SAFE_INTEGER
    const bTime = b.created_at
      ? new Date(b.created_at).getTime()
      : Number.MAX_SAFE_INTEGER

    return aTime - bTime
  })

  return { success: true, data: merged }
}

export async function getCategoryById(
  supabase: SupabaseClient,
  userId: UUID,
  categoryId: UUID
): Promise<ServiceResult<Category>> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
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
        message: "Category not found.",
      },
    }
  }

  const category = data as Category

  if (!canAccessCategory(category, userId)) {
    return {
      success: false,
      error: {
        status: 403,
        message: "You do not have access to this category.",
      },
    }
  }

  return { success: true, data: category }
}

export async function createCategory(
  supabase: SupabaseClient,
  userId: UUID,
  payload: CreateCategoryInput
): Promise<ServiceResult<Category>> {
  const normalizedName = payload.name.trim()
  const normalizedSlug = toKebabCase(payload.slug ?? normalizedName)

  if (!normalizedSlug) {
    return {
      success: false,
      error: {
        status: 400,
        message: "Unable to generate a valid slug from category name.",
      },
    }
  }

  const duplicate = await findCategoryByName(supabase, userId, normalizedName)

  if (!duplicate.success) {
    return duplicate as ServiceResult<Category>
  }

  if (duplicate.data.exists) {
    return {
      success: false,
      error: {
        status: 409,
        message: "Category with this name already exists.",
      },
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      is_default: false,
      name: normalizedName,
      type: payload.type,
      slug: normalizedSlug,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    })
    .select("*")
    .single()

  if (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    }
  }

  return { success: true, data: data as Category }
}

export async function updateCategory(
  supabase: SupabaseClient,
  userId: UUID,
  categoryId: UUID,
  payload: UpdateCategoryInput
): Promise<ServiceResult<Category>> {
  const existing = await getCategoryById(supabase, userId, categoryId)

  if (!existing.success) {
    return existing
  }

  if (existing.data.is_default) {
    return {
      success: false,
      error: {
        status: 403,
        message: "Default categories cannot be edited.",
      },
    }
  }

  const updates: Record<string, unknown> = {
    ...payload,
  }

  if (payload.name) {
    const normalizedName = payload.name.trim()

    const duplicate = await findCategoryByName(
      supabase,
      userId,
      normalizedName,
      categoryId
    )

    if (!duplicate.success) {
      return duplicate as ServiceResult<Category>
    }

    if (duplicate.data.exists) {
      return {
        success: false,
        error: {
          status: 409,
          message: "Category with this name already exists.",
        },
      }
    }

    updates.name = normalizedName
    updates.slug = toKebabCase(normalizedName)
  } else if (payload.slug) {
    updates.slug = toKebabCase(payload.slug)
  }

  if (typeof updates.slug === "string" && !updates.slug) {
    return {
      success: false,
      error: {
        status: 400,
        message: "Slug cannot be empty.",
      },
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", categoryId)
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
    data: data as Category,
  }
}

export async function deleteCategory(
  supabase: SupabaseClient,
  userId: UUID,
  categoryId: UUID
): Promise<ServiceResult<{ id: UUID }>> {
  const existing = await getCategoryById(supabase, userId, categoryId)

  if (!existing.success) {
    return existing as ServiceResult<{ id: UUID }>
  }

  if (existing.data.is_default) {
    return {
      success: false,
      error: {
        status: 403,
        message: "Default categories cannot be deleted.",
      },
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
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
        message: "Category not found.",
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
