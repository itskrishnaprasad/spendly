"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import type { Account, Category } from "@/types/base"
import type { BudgetProgress, BudgetWithRelations, CreateBudgetInput } from "@/types/budget"
import { BudgetForm } from "@/components/budgets/budget-form"
import { BudgetHeader } from "@/components/budgets/budget-header"
import { BudgetList } from "@/components/budgets/budget-list"
import { BudgetProgressSummary } from "@/components/budgets/budget-progress"
import { DeleteBudgetDialog } from "@/components/budgets/delete-budget-dialog"

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

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error("message" in payload ? payload.message : "Request failed.")
  }

  return {
    data: payload.data,
    message: payload.message,
  }
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithRelations[]>([])
  const [progress, setProgress] = useState<BudgetProgress[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithRelations | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<BudgetWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadReferences = useCallback(async () => {
    try {
      const [accountsResponse, categoriesResponse] = await Promise.all([
        requestJson<Account[]>("/api/accounts"),
        requestJson<Category[]>("/api/categories?type=expense"),
      ])

      setAccounts(accountsResponse.data)
      setCategories(categoriesResponse.data)
    } catch {
      setAccounts([])
      setCategories([])
      toast.error("Some reference data could not be loaded.")
    }
  }, [])

  const loadBudgets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [budgetsResponse, progressResponse] = await Promise.all([
        requestJson<BudgetWithRelations[]>("/api/budgets"),
        requestJson<BudgetProgress[]>("/api/budgets/progress"),
      ])

      setBudgets(budgetsResponse.data)
      setProgress(progressResponse.data)
    } catch (requestError) {
      setBudgets([])
      setProgress([])
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load budgets."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReferences()
      void loadBudgets()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadBudgets, loadReferences])

  const openCreate = () => {
    setEditingBudget(null)
    setIsFormOpen(true)
  }

  const openEdit = (budget: BudgetWithRelations) => {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  const handleSubmitBudget = async (payload: CreateBudgetInput) => {
    setIsSubmitting(true)

    try {
      if (editingBudget) {
        await requestJson<BudgetWithRelations>(`/api/budgets/${editingBudget.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        toast.success("Budget updated successfully.")
      } else {
        await requestJson<BudgetWithRelations>("/api/budgets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        toast.success("Budget created successfully.")
      }

      setIsFormOpen(false)
      setEditingBudget(null)
      await loadBudgets()
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save budget."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingBudget) {
      return
    }

    const target = deletingBudget
    const previousBudgets = budgets
    const previousProgress = progress

    setIsDeleting(true)
    setBudgets((current) => current.filter((item) => item.id !== target.id))
    setProgress((current) => current.filter((item) => item.id !== target.id))

    try {
      await requestJson<{ id: string }>(`/api/budgets/${target.id}`, {
        method: "DELETE",
      })

      toast.success("Budget deleted successfully.")
      setDeletingBudget(null)
    } catch (requestError) {
      setBudgets(previousBudgets)
      setProgress(previousProgress)
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Failed to delete budget."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const progressForDisplay = useMemo(() => {
    if (progress.length) {
      return progress
    }

    return budgets.map((budget) => ({
      id: budget.id,
      name: budget.name,
      period: budget.period,
      budget_amount: typeof budget.amount === "string" ? Number(budget.amount) : budget.amount,
      spent_amount: 0,
      remaining_amount: typeof budget.amount === "string" ? Number(budget.amount) : budget.amount,
      progress_percentage: 0,
      is_exceeded: false,
      is_alert_reached: false,
      start_date: budget.start_date,
      end_date: budget.end_date,
      period_start_date: budget.start_date,
      period_end_date: budget.end_date ?? budget.start_date,
      category: budget.category,
      account: budget.account,
    }))
  }, [budgets, progress])

  return (
    <main className="relative flex w-full flex-col gap-6 overflow-hidden pb-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden">
        <div className="absolute -left-20 -top-24 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 -top-20 size-64 rounded-full bg-secondary blur-3xl" />
      </div>

      <BudgetHeader onCreateBudget={openCreate} />

      <BudgetProgressSummary budgets={budgets} progress={progressForDisplay} />

      <BudgetList
        budgets={budgets}
        progress={progressForDisplay}
        loading={isLoading}
        error={error}
        onRetry={loadBudgets}
        onCreateBudget={openCreate}
        onEditBudget={openEdit}
        onDeleteBudget={setDeletingBudget}
      />

      <BudgetForm
        open={isFormOpen}
        mode={editingBudget ? "edit" : "create"}
        budget={editingBudget}
        categories={categories}
        accounts={accounts}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) {
            setEditingBudget(null)
          }
        }}
        onSubmit={handleSubmitBudget}
      />

      <DeleteBudgetDialog
        open={Boolean(deletingBudget)}
        budgetName={deletingBudget?.name ?? "this budget"}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBudget(null)
          }
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    </main>
  )
}
