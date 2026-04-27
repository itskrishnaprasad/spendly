import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { errorResponse, successResponse } from "@/utils/responses/api-response"
import { processRecurringTransactions } from "@/utils/services/recurring-transaction.service"

function authorizeInternalRequest(request: NextRequest) {
  const configuredSecret =
    process.env.CRON_SECRET ??
    process.env.VERCEL_CRON_SECRET ??
    process.env.INTERNAL_CRON_SECRET

  if (!configuredSecret) {
    return {
      authorized: false,
      status: 503,
      message: "Cron processing is not configured.",
    } as const
  }

  const authorizationHeader = request.headers.get("authorization")
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : null

  const headerSecret =
    request.headers.get("x-cron-secret") ??
    request.headers.get("x-internal-cron-secret")

  if (bearerToken === configuredSecret || headerSecret === configuredSecret) {
    return { authorized: true } as const
  }

  return {
    authorized: false,
    status: 401,
    message: "Unauthorized cron request.",
  } as const
}

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: {
        status: 500,
        message: "Cron processing client is not configured.",
      },
      client: null,
    } as const
  }

  return {
    error: null,
    client: createClient(supabaseUrl, serviceRoleKey),
  } as const
}

export async function POST(request: NextRequest) {
  const auth = authorizeInternalRequest(request)

  if (!auth.authorized) {
    return errorResponse(auth.message, { status: auth.status })
  }

  const serviceClientResult = createServiceRoleClient()

  if (!serviceClientResult.client) {
    return errorResponse(serviceClientResult.error.message, {
      status: serviceClientResult.error.status,
    })
  }

  const result = await processRecurringTransactions(serviceClientResult.client)

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data, {
    message: "Recurring transactions processed successfully.",
  })
}
