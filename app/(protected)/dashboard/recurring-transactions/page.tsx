"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import {
  FilterIcon,
  RepeatIcon,
  CalendarClockIcon,
  ActivityIcon,
  WalletIcon,
} from "lucide-react"

import type { Account, Category } from "@/types/base"
import type {
  RecurringTransactionWithRelations,
} from "@/types/recurring-transaction"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { DeleteRecurringDialog } from "@/app/(protected)/dashboard/recurring-transactions/_components/delete-recurring-dialog"
import { RecurringForm } from "@/app/(protected)/dashboard/recurring-transactions/_components/recurring-form"
import { RecurringHeader } from "@/app/(protected)/dashboard/recurring-transactions/_components/recurring-header"
import { RecurringList } from "@/app/(protected)/dashboard/recurring-transactions/_components/recurring-list"
import { RecurringSummary } from "@/app/(protected)/dashboard/recurring-transactions/_components/recurring-summary"
import { UpcomingSchedule } from "@/app/(protected)/dashboard/recurring-transactions/_components/upcoming-schedule"

import { recurringTransactionQuerySchema } from "@/utils/validations/recurring-transaction"
import type { CreateRecurringTransactionInput } from "@/utils/validations/recurring-transaction"

type ApiSuccessResponse<T> = {
  success: true
  data: T
  message?: string
}

type ApiErrorResponse = {
  success: false
  message: string
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

type RecurringFilters = {
  isActive: "all" | "true" | "false"
  frequency: "all" | "daily" | "weekly" | "monthly" | "yearly"
  type: "all" | "income" | "expense"
}

const initialFilters: RecurringFilters = {
  isActive: "all",
  frequency: "all",
  type: "all",
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error("message" in payload ? payload.message : "Request failed.")
  }

  return {
    data: payload.data,
    message: payload.message,
  }
}

function formatScheduleDate(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  return format(parseISO(value), "MMM d, yyyy")
}

function recurringQueryFromFilters(filters: RecurringFilters) {
  const params = new URLSearchParams()

  if (filters.isActive !== "all") {
    params.set("is_active", filters.isActive)
  }

  if (filters.frequency !== "all") {
    params.set("frequency", filters.frequency)
  }

  if (filters.type !== "all") {
    params.set("type", filters.type)
  }

  return params.toString()
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0
  }

  const numeric = typeof value === "string" ? Number(value) : value
  return Number.isFinite(numeric) ? numeric : 0
}

export default function RecurringTransactionsPage() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionWithRelations[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<RecurringFilters>(initialFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransactionWithRelations | null>(null)
  const [deletingRecurring, setDeletingRecurring] = useState<RecurringTransactionWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadReferences = useCallback(async () => {
    try {
      const [accountsResponse, expenseCategoriesResponse, incomeCategoriesResponse] = await Promise.all([
        requestJson<Account[]>("/api/accounts"),
        requestJson<Category[]>("/api/categories?type=expense"),
        requestJson<Category[]>("/api/categories?type=income"),
      ])

      setAccounts(accountsResponse.data)
      setCategories([...expenseCategoriesResponse.data, ...incomeCategoriesResponse.data])
    } catch {
      setAccounts([])
      setCategories([])
      toast.error("Some recurring references could not be loaded.")
    }
  }, [])

  const loadRecurring = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queryString = recurringQueryFromFilters(filters)
      const endpoint = queryString ? `/api/recurring-transactions?${queryString}` : "/api/recurring-transactions"
      const response = await requestJson<RecurringTransactionWithRelations[]>(endpoint)
      setRecurringTransactions(response.data)
    } catch (requestError) {
      setRecurringTransactions([])
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load recurring transactions."
      )
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReferences()
      void loadRecurring()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadRecurring, loadReferences])

  const openCreate = () => {
    setEditingRecurring(null)
    setFormOpen(true)
  }

  const openEdit = (item: RecurringTransactionWithRelations) => {
    setEditingRecurring(item)
    setFormOpen(true)
  }

  const submitRecurring = async (values: CreateRecurringTransactionInput) => {
    setIsSubmitting(true)

    try {
      if (editingRecurring) {
        await requestJson<RecurringTransactionWithRelations>(`/api/recurring-transactions/${editingRecurring.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })
        toast.success("Recurring transaction updated successfully.")
      } else {
        await requestJson<RecurringTransactionWithRelations>("/api/recurring-transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })
        toast.success("Recurring transaction created successfully.")
      }

      setFormOpen(false)
      setEditingRecurring(null)
      await loadRecurring()
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Failed to save recurring transaction.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteRecurring = async () => {
    if (!deletingRecurring) {
      return
    }

    const target = deletingRecurring
    const previous = recurringTransactions

    setIsDeleting(true)
    setRecurringTransactions((current) => current.filter((item) => item.id !== target.id))

    try {
      await requestJson<{ id: string }>(`/api/recurring-transactions/${target.id}`, {
        method: "DELETE",
      })
      toast.success("Recurring transaction deleted successfully.")
      setDeletingRecurring(null)
    } catch (requestError) {
      setRecurringTransactions(previous)
      toast.error(requestError instanceof Error ? requestError.message : "Failed to delete recurring transaction.")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleActive = async (item: RecurringTransactionWithRelations) => {
    const nextValue = item.is_active === false
    const previous = recurringTransactions

    setRecurringTransactions((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, is_active: nextValue } : entry
      )
    )

    try {
      await requestJson<RecurringTransactionWithRelations>(`/api/recurring-transactions/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: nextValue }),
      })
      toast.success(nextValue ? "Recurring transaction activated." : "Recurring transaction deactivated.")
    } catch (requestError) {
      setRecurringTransactions(previous)
      toast.error(requestError instanceof Error ? requestError.message : "Failed to update recurring transaction status.")
    }
  }

  const summaryData = useMemo(() => recurringTransactions, [recurringTransactions])
  const upcomingData = useMemo(
    () => [...recurringTransactions].sort((a, b) => a.next_run_date.localeCompare(b.next_run_date)),
    [recurringTransactions]
  )

  return (
    <main className="relative flex w-full flex-col gap-6">
      <div className="pointer-events-none absolute inset-x-0 -top-6 -z-10 h-64 overflow-hidden">
        <div className="absolute -left-20 -top-24 size-80 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-0 -top-20 size-72 rounded-full bg-secondary blur-3xl" />
      </div>

      <RecurringHeader onCreateRecurring={openCreate} />

      <RecurringSummary recurringTransactions={summaryData} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-4">
          <Card className="border-border/60 bg-card/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FilterIcon className="size-4 text-primary" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Select value={filters.isActive} onValueChange={(value) => setFilters((prev) => ({ ...prev, isActive: value as RecurringFilters["isActive"] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.frequency} onValueChange={(value) => setFilters((prev) => ({ ...prev, frequency: value as RecurringFilters["frequency"] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All frequencies</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value as RecurringFilters["type"] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <RecurringList
            recurringTransactions={recurringTransactions}
            loading={loading}
            error={error}
            onRetry={loadRecurring}
            onCreateRecurring={openCreate}
            onEditRecurring={openEdit}
            onDeleteRecurring={setDeletingRecurring}
            onToggleActive={toggleActive}
          />
        </div>

        <UpcomingSchedule
          recurringTransactions={upcomingData}
          loading={loading}
          error={error}
          onRetry={loadRecurring}
        />
      </section>

      <RecurringForm
        open={formOpen}
        mode={editingRecurring ? "edit" : "create"}
        recurring={editingRecurring}
        accounts={accounts}
        categories={categories}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingRecurring(null)
          }
        }}
        onSubmit={submitRecurring}
      />

      <DeleteRecurringDialog
        open={Boolean(deletingRecurring)}
        title={deletingRecurring?.title ?? "this recurring transaction"}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRecurring(null)
          }
        }}
        onConfirmDelete={deleteRecurring}
      />
    </main>
  )
}
