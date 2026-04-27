"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import {
  AlertCircleIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
} from "lucide-react"

import type { Account, Category, Transaction } from "@/types/base"
import type { TransactionType } from "@/types/enums"
import { CreateTransactionDialog } from "@/app/(protected)/dashboard/transactions/_components/create-transaction-dialog"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  transactionQuerySchema,
} from "@/utils/validations/transaction"

import {
  TransactionFiltersPanel,
  type TransactionFilters,
} from "./_components/transaction-filters-panel"
import { TransactionPagination } from "./_components/transaction-pagination"
import { TransactionTable } from "./_components/transaction-table"
import { TransactionTableSkeleton } from "./_components/transaction-table-skeleton"

type TransactionsPageResponse = {
  items: Transaction[]
  page: number
  limit: number
  total: number
  total_pages: number
}

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

type TransactionState = {
  loading: boolean
  items: Transaction[]
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
}

const initialFilterState: TransactionFilters = {
  accountId: "",
  categoryId: "",
  search: "",
  from: "",
  to: "",
}

const initialTransactionState: TransactionState = {
  loading: false,
  items: [],
  error: null,
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1,
}

function TransactionsTabBody({
  tab,
  activeTab,
  filters,
  accounts,
  categories,
  accountsLoading,
  categoriesLoading,
  transactionsState,
  onFiltersChange,
  onPageReset,
  onPageChange,
  onLimitChange,
  onClearFilters,
  onTransactionChanged,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  tab: TransactionType
  activeTab: TransactionType
  filters: TransactionFilters
  accounts: Account[]
  categories: Category[]
  accountsLoading: boolean
  categoriesLoading: boolean
  transactionsState: TransactionState
  onFiltersChange: (updater: (previous: TransactionFilters) => TransactionFilters) => void
  onPageReset: () => void
  onPageChange: (page: number) => void
  onLimitChange: (value: number) => void
  onClearFilters: () => void
  onTransactionChanged: () => void
  emptyIcon: ReactNode
  emptyTitle: string
  emptyDescription: string
}) {
  if (activeTab !== tab) {
    return null
  }

  return (
    <div className="space-y-4">
      <TransactionFiltersPanel
        accounts={accounts}
        categories={categories}
        accountsLoading={accountsLoading}
        categoriesLoading={categoriesLoading}
        filters={filters}
        limit={transactionsState.limit}
        onFiltersChange={onFiltersChange}
        onPageReset={onPageReset}
        onLimitChange={onLimitChange}
        onClearFilters={onClearFilters}
      />

      {transactionsState.loading ? (
        <TransactionTableSkeleton />
      ) : transactionsState.error ? (
        <EmptyState>
          <AlertCircleIcon className="size-5 text-muted-foreground" />
          <EmptyStateTitle className="mt-3">Unable to load transactions</EmptyStateTitle>
          <EmptyStateDescription>{transactionsState.error}</EmptyStateDescription>
        </EmptyState>
      ) : transactionsState.items.length === 0 ? (
        <EmptyState>
          {emptyIcon}
          <EmptyStateTitle className="mt-3">{emptyTitle}</EmptyStateTitle>
          <EmptyStateDescription>{emptyDescription}</EmptyStateDescription>
          <div className="mt-4">
            <CreateTransactionDialog
              defaultType={tab}
              onTransactionCreated={onTransactionChanged}
            />
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {transactionsState.items.length} of {transactionsState.total} transactions
            </p>
            <p>
              Page {transactionsState.page} of {transactionsState.totalPages}
            </p>
          </div>
          <TransactionTable
            items={transactionsState.items}
            accounts={accounts}
            categories={categories}
            onTransactionChanged={onTransactionChanged}
          />
          <TransactionPagination
            currentPage={transactionsState.page}
            totalPages={transactionsState.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TransactionType>("expense")
  const [transactionsState, setTransactionsState] = useState<TransactionState>(
    initialTransactionState
  )
  const [filters, setFilters] = useState<TransactionFilters>(initialFilterState)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [refetchKey, setRefetchKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function fetchAccounts() {
      setAccountsLoading(true)
      try {
        const response = await fetch("/api/accounts", { cache: "no-store" })
        const payload = (await response.json()) as
          | ApiSuccessResponse<Account[]>
          | ApiErrorResponse

        if (!response.ok || !payload.success) {
          throw new Error(
            "message" in payload ? payload.message : "Failed to load accounts."
          )
        }

        if (isMounted) {
          setAccounts(payload.data)
        }
      } catch {
        if (isMounted) {
          setAccounts([])
        }
      } finally {
        if (isMounted) {
          setAccountsLoading(false)
        }
      }
    }

    void fetchAccounts()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function fetchCategories() {
      setCategoriesLoading(true)
      try {
        const response = await fetch(`/api/categories?type=${activeTab}`, {
          cache: "no-store",
        })
        const payload = (await response.json()) as
          | ApiSuccessResponse<Category[]>
          | ApiErrorResponse

        if (!response.ok || !payload.success) {
          throw new Error(
            "message" in payload ? payload.message : "Failed to load categories."
          )
        }

        if (isMounted) {
          setCategories(payload.data)
        }
      } catch {
        if (isMounted) {
          setCategories([])
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false)
        }
      }
    }

    setFilters((previous) => ({ ...previous, categoryId: "" }))
    void fetchCategories()

    return () => {
      isMounted = false
    }
  }, [activeTab])

  useEffect(() => {
    let isMounted = true
    const timer = window.setTimeout(async () => {
      setTransactionsState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }))

      const parsedFilters = transactionQuerySchema.safeParse({
        type: activeTab,
        account_id: filters.accountId || undefined,
        category_id: filters.categoryId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        search: filters.search || undefined,
        page: transactionsState.page,
        limit: transactionsState.limit,
      })

      if (!parsedFilters.success) {
        if (isMounted) {
          setTransactionsState((previous) => ({
            ...previous,
            loading: false,
            error: parsedFilters.error.issues[0]?.message ?? "Invalid filters.",
          }))
        }
        return
      }

      try {
        const params = new URLSearchParams({ type: activeTab })
        if (filters.accountId) params.set("account_id", filters.accountId)
        if (filters.categoryId) params.set("category_id", filters.categoryId)
        if (filters.from) params.set("from", filters.from)
        if (filters.to) params.set("to", filters.to)
        if (filters.search) params.set("search", filters.search)
        params.set("page", String(transactionsState.page))
        params.set("limit", String(transactionsState.limit))

        const response = await fetch(`/api/transactions?${params.toString()}`, {
          cache: "no-store",
        })

        const payload = (await response.json()) as
          | ApiSuccessResponse<TransactionsPageResponse>
          | ApiErrorResponse

        if (!response.ok || !payload.success) {
          throw new Error(
            "message" in payload ? payload.message : "Failed to load transactions."
          )
        }

        if (isMounted) {
          setTransactionsState({
            loading: false,
            items: payload.data.items,
            error: null,
            page: payload.data.page,
            limit: payload.data.limit,
            total: payload.data.total,
            totalPages: payload.data.total_pages,
          })
        }
      } catch (error) {
        if (isMounted) {
          setTransactionsState((previous) => ({
            ...previous,
            loading: false,
            error:
              error instanceof Error ? error.message : "Failed to load transactions.",
          }))
        }
      }
    }, 250)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [activeTab, filters.accountId, filters.categoryId, filters.from, filters.search, filters.to, refetchKey, transactionsState.limit, transactionsState.page])

  const handleTransactionChanged = useCallback(() => {
    setRefetchKey((previous) => previous + 1)
  }, [])

  const handleFiltersChange = useCallback(
    (updater: (previous: TransactionFilters) => TransactionFilters) => {
      setFilters((previous) => updater(previous))
      setTransactionsState((previous) => ({ ...previous, page: 1 }))
    },
    []
  )

  const handlePageReset = useCallback(() => {
    setTransactionsState((previous) => ({ ...previous, page: 1 }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setTransactionsState((previous) => ({ ...previous, page }))
  }, [])

  const handleLimitChange = useCallback((value: number) => {
    setTransactionsState((previous) => ({
      ...previous,
      limit: value,
      page: 1,
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilterState)
    setTransactionsState((previous) => ({ ...previous, page: 1 }))
  }, [])

  return (
    <main className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Track your income and expenses across accounts and categories.
          </p>
        </div>
        <CreateTransactionDialog
          defaultType={activeTab}
          onTransactionCreated={handleTransactionChanged}
        />
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "expense" || value === "income") {
            setActiveTab(value)
            setTransactionsState((previous) => ({ ...previous, page: 1 }))
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-4">
          <TransactionsTabBody
            tab="expense"
            activeTab={activeTab}
            filters={filters}
            accounts={accounts}
            categories={categories}
            accountsLoading={accountsLoading}
            categoriesLoading={categoriesLoading}
            transactionsState={transactionsState}
            onFiltersChange={handleFiltersChange}
            onPageReset={handlePageReset}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onClearFilters={handleClearFilters}
            onTransactionChanged={handleTransactionChanged}
            emptyIcon={<ArrowDownRightIcon className="size-5 text-muted-foreground" />}
            emptyTitle="No expense transactions found"
            emptyDescription="Start by creating your first expense transaction."
          />
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <TransactionsTabBody
            tab="income"
            activeTab={activeTab}
            filters={filters}
            accounts={accounts}
            categories={categories}
            accountsLoading={accountsLoading}
            categoriesLoading={categoriesLoading}
            transactionsState={transactionsState}
            onFiltersChange={handleFiltersChange}
            onPageReset={handlePageReset}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onClearFilters={handleClearFilters}
            onTransactionChanged={handleTransactionChanged}
            emptyIcon={<ArrowUpRightIcon className="size-5 text-muted-foreground" />}
            emptyTitle="No income transactions found"
            emptyDescription="Start by creating your first income transaction."
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
