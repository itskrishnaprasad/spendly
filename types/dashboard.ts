import type { Account, Category, Transaction } from "@/types/base"
import type { AccountType, TransactionType } from "@/types/enums"
import type { UUID } from "@/types/primitives"

export interface DashboardSummary {
  total_balance: number
  total_income: number
  total_expense: number
  savings: number
}

export interface DashboardMonthlyOverviewItem {
  month: string
  income: number
  expense: number
  savings: number
}

export interface DashboardExpenseCategoryBreakdown {
  category_id: UUID
  category_name: string
  category_color: string | null
  total: number
}

export interface DashboardRecentTransactionAccount extends Pick<
  Account,
  "id" | "name" | "type" | "color" | "icon"
> {}

export interface DashboardRecentTransactionCategory extends Pick<
  Category,
  "id" | "name" | "slug" | "type" | "color" | "icon"
> {}

export interface DashboardRecentTransaction extends Pick<
  Transaction,
  | "id"
  | "user_id"
  | "account_id"
  | "category_id"
  | "type"
  | "amount"
  | "title"
  | "note"
  | "transaction_date"
  | "is_recurring"
  | "recurring_transaction_id"
  | "created_at"
  | "updated_at"
> {
  account: DashboardRecentTransactionAccount
  category: DashboardRecentTransactionCategory
}

export type DashboardTransactionType = TransactionType
