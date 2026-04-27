import { NextRequest } from "next/server"

import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/utils/responses/api-response"
import {
  createRecurringTransaction,
  getRecurringTransactions,
} from "@/utils/services/recurring-transaction"
import {
  createRecurringTransactionSchema,
  recurringTransactionQuerySchema,
} from "@/utils/validations/recurring-transaction"

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const parsedQuery = recurringTransactionQuerySchema.safeParse({
    is_active: request.nextUrl.searchParams.get("is_active") || undefined,
    frequency: request.nextUrl.searchParams.get("frequency") || undefined,
    type: request.nextUrl.searchParams.get("type") || undefined,
  })

  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error)
  }

  const result = await getRecurringTransactions(
    auth.supabase,
    auth.user.id,
    parsedQuery.data
  )

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

  const parsedPayload = createRecurringTransactionSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return validationErrorResponse(parsedPayload.error)
  }

  const result = await createRecurringTransaction(
    auth.supabase,
    auth.user.id,
    parsedPayload.data
  )

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    status: 201,
    message: "Recurring transaction created successfully.",
  })
}
