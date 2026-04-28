"use client"

import { useCallback, useEffect, useState } from "react"

import type { Account } from "@/types/base"
import type {
  DashboardExpenseCategoryBreakdown,
  DashboardMonthlyOverviewItem,
  DashboardRecentTransaction,
  DashboardSummary,
} from "@/types/dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"

import { SummaryCards } from "./summary-cards"
import { MonthlyOverviewChart } from "./monthly-overview-chart"
import { ExpenseCategoryChart } from "./expense-category-chart"
import { RecentTransactions } from "./recent-transactions"
import { AccountBalances } from "./account-balances"

type ApiSuccessResponse<T> = {
  success: true
  data: T
  message?: string
}

type ApiErrorResponse = {
  success: false
  message: string
}

type ResourceState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

const initialResourceState = <T,>(): ResourceState<T> => ({
  data: null,
  loading: true,
  error: null,
})

async function fetchResource<T>(
  url: string,
  fallbackMessage: string
): Promise<T> {
  const response = await fetch(url, { cache: "no-store" })
  const payload = (await response.json()) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse

  if (!response.ok || !payload.success) {
    throw new Error(
      "message" in payload ? payload.message : fallbackMessage
    )
  }

  return payload.data
}

function useDashboardResource<T>(url: string, fallbackMessage: string) {
  const [state, setState] = useState<ResourceState<T>>(initialResourceState<T>())

  const load = useCallback(async () => {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }))

    try {
      const data = await fetchResource<T>(url, fallbackMessage)
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error:
          error instanceof Error ? error.message : fallbackMessage,
      })
    }
  }, [fallbackMessage, url])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }))

      try {
        const data = await fetchResource<T>(url, fallbackMessage)

        if (cancelled) {
          return
        }

        setState({ data, loading: false, error: null })
      } catch (error) {
        if (cancelled) {
          return
        }

        setState({
          data: null,
          loading: false,
          error:
            error instanceof Error ? error.message : fallbackMessage,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fallbackMessage, url])

  return {
    ...state,
    refresh: load,
  }
}

export function DashboardPage() {
  const summary = useDashboardResource<DashboardSummary>(
    "/api/dashboard/summary",
    "Failed to load dashboard summary."
  )
  const monthlyOverview = useDashboardResource<DashboardMonthlyOverviewItem[]>(
    "/api/dashboard/monthly-overview",
    "Failed to load monthly overview."
  )
  const expenseByCategory = useDashboardResource<DashboardExpenseCategoryBreakdown[]>(
    "/api/dashboard/expense-by-category",
    "Failed to load expense breakdown."
  )
  const recentTransactions = useDashboardResource<DashboardRecentTransaction[]>(
    "/api/dashboard/recent-transactions",
    "Failed to load recent transactions."
  )
  const accounts = useDashboardResource<Account[]>(
    "/api/accounts",
    "Failed to load account balances."
  )

  return (
    <main className="relative flex w-full flex-col gap-6">
      <div className="pointer-events-none absolute inset-x-0 -top-6 -z-10 h-64 overflow-hidden">
        <div className="absolute -left-20 -top-24 size-80 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-0 -top-20 size-72 rounded-full bg-secondary blur-3xl" />
      </div>

      <SummaryCards
        data={summary.data}
        loading={summary.loading}
        error={summary.error}
        onRetry={summary.refresh}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <MonthlyOverviewChart
          data={monthlyOverview.data}
          loading={monthlyOverview.loading}
          error={monthlyOverview.error}
        />
        <ExpenseCategoryChart
          data={expenseByCategory.data}
          loading={expenseByCategory.loading}
          error={expenseByCategory.error}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <RecentTransactions
          data={recentTransactions.data}
          loading={recentTransactions.loading}
          error={recentTransactions.error}
        />
        <AccountBalances
          data={accounts.data}
          loading={accounts.loading}
          error={accounts.error}
        />
      </section>

      {(summary.error || monthlyOverview.error || expenseByCategory.error || recentTransactions.error || accounts.error) && (
        <Card className="border-border/60 shadow-xs">
          <div className="p-4">
            <Alert>
              <AlertTitle>Some dashboard data could not be loaded</AlertTitle>
              <AlertDescription>
                One or more sections failed to refresh. You can retry each section by reloading the page.
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      )}
    </main>
  )
}
