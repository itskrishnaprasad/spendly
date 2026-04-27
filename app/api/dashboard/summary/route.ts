import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import { errorResponse, successResponse } from "@/utils/responses/api-response"
import { getDashboardSummary } from "@/utils/services/dashboard.service"

export async function GET() {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const result = await getDashboardSummary(auth.supabase, auth.user.id)

  if (!result.success) {
    return errorResponse("Unable to load dashboard summary.", {
      status: result.error.status,
    })
  }

  return successResponse(result.data)
}
