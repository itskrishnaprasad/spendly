import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import { errorResponse, successResponse } from "@/utils/responses/api-response"
import { getRecentTransactions } from "@/utils/services/dashboard"

export async function GET() {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const result = await getRecentTransactions(auth.supabase, auth.user.id)

  if (!result.success) {
    return errorResponse("Unable to load recent transactions.", {
      status: result.error.status,
    })
  }

  return successResponse(result.data)
}
