import type {
  Account,
  RecurringTransaction as BaseRecurringTransaction,
  Category,
} from "@/types/base"
import type { RecurringFrequency, TransactionType } from "@/types/enums"
import type { ISODateString, UUID } from "@/types/primitives"

export type RecurringTransaction = BaseRecurringTransaction

export interface CreateRecurringTransactionInput {
  account_id: UUID
  category_id: UUID
  type: TransactionType
  amount: number
  title: string
  note?: string | null
  frequency: RecurringFrequency
  interval_count?: number
  start_date: ISODateString
  end_date?: ISODateString | null
  is_active?: boolean
}

export interface UpdateRecurringTransactionInput {
  account_id?: UUID
  category_id?: UUID
  type?: TransactionType
  amount?: number
  title?: string
  note?: string | null
  frequency?: RecurringFrequency
  interval_count?: number
  start_date?: ISODateString
  end_date?: ISODateString | null
  is_active?: boolean
}

export interface RecurringTransactionWithRelations extends RecurringTransaction {
  account: Pick<Account, "id" | "name" | "type" | "color" | "icon"> | null
  category: Pick<
    Category,
    "id" | "name" | "slug" | "type" | "color" | "icon"
  > | null
}

export interface ProcessRecurringTransactionResult {
  processed_count: number
  created_transactions: number
  skipped_count: number
  failed_count: number
}
