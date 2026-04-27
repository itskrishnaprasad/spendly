import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import { errorResponse, successResponse } from "@/utils/responses/api-response"
import { getBudgetProgress } from "@/utils/services/budget.service"

export async function GET() {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const result = await getBudgetProgress(auth.supabase, auth.user.id)

  if (!result.success) {
    return errorResponse(result.error.message, {
      status: result.error.status,
      errors: result.error.errors,
    })
  }

  return successResponse(result.data)
}
