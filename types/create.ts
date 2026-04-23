import type {
  AccountType,
  BudgetPeriod,
  RecurringFrequency,
  TransactionType,
} from "@/types/enums"
import type { ISODateString, UUID } from "@/types/primitives"

export interface CreateAccount {
  name: string
  type: AccountType
  balance?: number
  color?: string
  icon?: string
}

export interface CreateCategory {
  name: string
  slug: string
  type: TransactionType
  icon?: string
  color?: string
}

export interface CreateTransaction {
  account_id: UUID
  category_id: UUID
  type: TransactionType
  amount: number
  title: string
  note?: string
  transaction_date: ISODateString
  is_recurring?: boolean
  recurring_transaction_id?: UUID
}

export interface CreateBudget {
  category_id?: UUID
  account_id?: UUID
  name: string
  amount: number
  period: BudgetPeriod
  start_date: ISODateString
  end_date?: ISODateString
  alert_percentage?: number
}

export interface CreateRecurringTransaction {
  account_id: UUID
  category_id: UUID
  type: TransactionType
  amount: number
  title: string
  note?: string
  frequency: RecurringFrequency
  interval_count?: number
  start_date: ISODateString
  end_date?: ISODateString
  next_run_date: ISODateString
}
