import { NextRequest } from "next/server"

import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/utils/responses/api-response"
import { createAccount, getAccounts } from "@/utils/services/account.service"
import { createAccountSchema } from "@/utils/validations/category"

export async function GET() {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const result = await getAccounts(auth.supabase, auth.user.id)

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

  const parsed = createAccountSchema.safeParse(payload)

  if (!parsed.success) {
    return validationErrorResponse(parsed.error)
  }

  const result = await createAccount(auth.supabase, auth.user.id, parsed.data)

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    status: 201,
    message: "Account created successfully.",
  })
}
