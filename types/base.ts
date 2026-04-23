import type {
  AccountType,
  BudgetPeriod,
  RecurringFrequency,
  TransactionType,
} from "@/types/enums"
import type { DecimalLike, ISODateString, UUID } from "@/types/primitives"

export interface Profile {
  id: UUID
  email: string | null
  full_name: string | null
  avatar_url: string | null
  currency: string | null
  timezone: string | null
  created_at: ISODateString | null
  updated_at: ISODateString | null
}

export interface Account {
  id: UUID
  user_id: UUID
  name: string
  type: AccountType
  balance: DecimalLike | null
  color: string | null
  icon: string | null
  is_archived: boolean | null
  created_at: ISODateString | null
  updated_at: ISODateString | null
}

export interface Category {
  id: UUID
  user_id: UUID | null
  name: string
  slug: string
  type: TransactionType
  icon: string | null
  color: string | null
  is_default: boolean | null
  created_at: ISODateString | null
}

export interface Budget {
  id: UUID
  user_id: UUID
  category_id: UUID | null
  account_id: UUID | null
  name: string
  amount: DecimalLike
  period: BudgetPeriod
  start_date: ISODateString
  end_date: ISODateString | null
  alert_percentage: number | null
  is_active: boolean | null
  created_at: ISODateString | null
  updated_at: ISODateString | null
}

export interface RecurringTransaction {
  id: UUID
  user_id: UUID
  account_id: UUID
  category_id: UUID
  type: TransactionType
  amount: DecimalLike
  title: string
  note: string | null
  frequency: RecurringFrequency
  interval_count: number | null
  start_date: ISODateString
  end_date: ISODateString | null
  next_run_date: ISODateString
  last_run_date: ISODateString | null
  is_active: boolean | null
  created_at: ISODateString | null
  updated_at: ISODateString | null
}

export interface Transaction {
  id: UUID
  user_id: UUID
  account_id: UUID
  category_id: UUID
  type: TransactionType
  amount: DecimalLike
  title: string
  note: string | null
  transaction_date: ISODateString
  is_recurring: boolean | null
  recurring_transaction_id: UUID | null
  created_at: ISODateString | null
  updated_at: ISODateString | null
}
