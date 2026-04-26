import { NextRequest } from "next/server"

import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/utils/responses/api-response"
import {
  createTransaction,
  getTransactions,
} from "@/utils/services/transaction.service"
import {
  createTransactionSchema,
  transactionQuerySchema,
} from "@/utils/validations/transactions"

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const parsedQuery = transactionQuerySchema.safeParse({
    type: request.nextUrl.searchParams.get("type") || undefined,
    category_id: request.nextUrl.searchParams.get("category_id") || undefined,
    account_id: request.nextUrl.searchParams.get("account_id") || undefined,
    from: request.nextUrl.searchParams.get("from") || undefined,
    to: request.nextUrl.searchParams.get("to") || undefined,
    search: request.nextUrl.searchParams.get("search") || undefined,
    page: request.nextUrl.searchParams.get("page") || undefined,
    limit: request.nextUrl.searchParams.get("limit") || undefined,
  })

  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error)
  }

  const result = await getTransactions(
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

  const parsed = createTransactionSchema.safeParse(payload)

  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  const result = await createTransaction(
    auth.supabase,
    auth.user.id,
    parsed.data
  )

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    status: 201,
    message: "Transaction created successfully.",
  })
}
