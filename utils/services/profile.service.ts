import type { SupabaseClient } from "@supabase/supabase-js"
import type { Profile } from "@/types/base"
import type { UUID } from "@/types/primitives"

type ServiceError = {
  status: number
  message: string
}

type ServiceResult<T> =
  | {
      success: true
      data: T
      error?: never
    }
  | {
      success: false
      data?: never
      error: ServiceError
    }

export async function getProfile(
  supabase: SupabaseClient,
  userId: UUID
): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    return {
      success: false,
      error: {
        status: 500,
        message: "Failed to fetch profile.",
      },
    }
  }

  if (!data) {
    return {
      success: false,
      error: {
        status: 404,
        message: "Profile not found.",
      },
    }
  }

  return {
    success: true,
    data: data as Profile,
  }
}
