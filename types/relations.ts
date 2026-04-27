import type {
  Account,
  Category,
  RecurringTransaction,
  Transaction,
} from "@/types/base"

export interface TransactionWithRelations extends Transaction {
  account: Account
  category: Category
}

export interface RecurringTransactionWithRelations extends RecurringTransaction {
  account: Account
  category: Category
}
