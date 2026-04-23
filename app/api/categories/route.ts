import { NextRequest } from "next/server"

import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/utils/responses/api-response"
import {
  createCategory,
  getCategories,
} from "@/utils/services/category.service"
import {
  createCategorySchema,
  transactionTypeSchema,
} from "@/utils/validations/category"
import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const typeRaw = request.nextUrl.searchParams.get("type")

  if (!typeRaw) {
    const result = await getCategories(auth.supabase, auth.user.id)

    if (!result.success) {
      return errorResponse(result.error.message, {
        status: result.error.status,
        errors: result.error.errors,
      })
    }

    return successResponse(result.data)
  }

  const parsedType = transactionTypeSchema.safeParse(typeRaw)

  if (!parsedType.success) {
    return validationErrorResponse(parsedType.error)
  }

  const result = await getCategories(auth.supabase, auth.user.id, {
    type: parsedType.data,
  })

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return errorResponse("Invalid JSON payload.", { status: 400 })
  }

  const parsed = createCategorySchema.safeParse(payload)

  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  const result = await createCategory(auth.supabase, auth.user.id, parsed.data)

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    status: 201,
    message: "Category created successfully.",
  })
}
