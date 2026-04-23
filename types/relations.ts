import type {
  Account,
  Budget,
  Category,
  RecurringTransaction,
  Transaction,
} from "@/types/base"

export interface TransactionWithRelations extends Transaction {
  account: Account
  category: Category
}

export interface BudgetWithRelations extends Budget {
  account?: Account | null
  category?: Category | null
}

export interface RecurringTransactionWithRelations extends RecurringTransaction {
  account: Account
  category: Category
}
