import { NextRequest } from "next/server"

import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/utils/responses/api-response"
import {
  deleteAccount,
  getAccountById,
  updateAccount,
} from "@/utils/services/account.service"
import {
  accountIdSchema,
  updateAccountSchema,
} from "@/utils/validations/category"

type RouteContext = {
  params: Promise<{ id: string }>
}

async function parseAccountId(paramsPromise: RouteContext["params"]) {
  const params = await paramsPromise
  const parsedId = accountIdSchema.safeParse(params.id)

  if (!parsedId.success) {
    return { error: parsedId.error, id: undefined } as const
  }

  return { id: parsedId.data, error: undefined } as const
}

export async function GET(_: NextRequest, { params }: RouteContext) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const parsedId = await parseAccountId(params)

  if (parsedId.error !== undefined) {
    return validationErrorResponse(parsedId.error)
  }

  const result = await getAccountById(auth.supabase, auth.user.id, parsedId.id)

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data)
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const parsedId = await parseAccountId(params)

  if (parsedId.error !== undefined) {
    return validationErrorResponse(parsedId.error)
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return errorResponse("Invalid JSON payload.", { status: 400 })
  }

  const parsedPayload = updateAccountSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return validationErrorResponse(parsedPayload.error)
  }

  const result = await updateAccount(
    auth.supabase,
    auth.user.id,
    parsedId.id,
    parsedPayload.data
  )

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    message: "Account updated successfully.",
  })
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const parsedId = await parseAccountId(params)

  if (parsedId.error !== undefined) {
    return validationErrorResponse(parsedId.error)
  }

  const result = await deleteAccount(auth.supabase, auth.user.id, parsedId.id)

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    message: "Account deleted successfully.",
  })
}
