import { NextResponse } from "next/server"

import { requireAuthenticatedUser } from "@/utils/auth/require-authenticated-user"
import { getProfile } from "@/utils/services/profile.service"
import { errorResponse, successResponse } from "@/utils/responses/api-response"

export async function GET() {
  const auth = await requireAuthenticatedUser()

  if ("response" in auth) {
    return auth.response
  }

  const { supabase, user } = auth

  const profileResult = await getProfile(supabase, user.id)

  if (!profileResult.success) {
    return errorResponse(profileResult.error.message, {
      status: profileResult.error.status,
    })
  }

  const profile = profileResult.data

  return successResponse({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email || user.email,
    avatar_url: profile.avatar_url,
  })
}
