import { NextResponse } from "next/server"
import type { ZodError } from "zod"

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: unknown
}

export function successResponse<T>(
  data: T,
  options?: { message?: string; status?: number }
) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
  }

  return NextResponse.json(body, { status: options?.status ?? 200 })
}

export function errorResponse(
  message: string,
  options?: { status?: number; errors?: unknown }
) {
  const body: ApiErrorResponse = {
    success: false,
    message,
    ...(options?.errors ? { errors: options.errors } : {}),
  }

  return NextResponse.json(body, { status: options?.status ?? 400 })
}

export function validationErrorResponse(error: ZodError) {
  return errorResponse("Validation failed.", {
    status: 400,
    errors: error.flatten(),
  })
}
