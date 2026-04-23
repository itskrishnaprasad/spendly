import { cookies } from "next/headers"

import type { User } from "@supabase/supabase-js"

import { errorResponse } from "@/utils/responses/api-response"
import { createClient } from "@/utils/supabase/server"

export type AuthenticatedContext = {
  supabase: ReturnType<typeof createClient>
  user: User
}

export type AuthenticatedResult =
  | AuthenticatedContext
  | {
      response: ReturnType<typeof errorResponse>
    }

export async function requireAuthenticatedUser(): Promise<AuthenticatedResult> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      response: errorResponse("Unauthorized.", { status: 401 }),
    }
  }

  return { supabase, user }
}
