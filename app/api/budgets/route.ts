import { NextRequest } from "next/server"

import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/utils/responses/api-response"
import { createBudget, getBudgets } from "@/utils/services/budget.service"
import {
  budgetsQuerySchema,
  createBudgetSchema,
} from "@/utils/validations/budget"

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const parsedQuery = budgetsQuerySchema.safeParse({
    is_active: request.nextUrl.searchParams.get("is_active") || undefined,
    period: request.nextUrl.searchParams.get("period") || undefined,
    category_id: request.nextUrl.searchParams.get("category_id") || undefined,
    account_id: request.nextUrl.searchParams.get("account_id") || undefined,
  })

  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error)
  }

  const result = await getBudgets(auth.supabase, auth.user.id, parsedQuery.data)

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

  const parsed = createBudgetSchema.safeParse(payload)

  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  const result = await createBudget(auth.supabase, auth.user.id, parsed.data)

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    status: 201,
    message: "Budget created successfully.",
  })
}
