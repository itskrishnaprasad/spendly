import type { AccountType, BudgetPeriod, TransactionType } from "@/types/enums"
import type { ISODateString, UUID } from "@/types/primitives"

export interface TransactionFormValues {
  account_id: UUID
  category_id: UUID
  type: TransactionType
  amount: number
  title: string
  note?: string
  transaction_date: ISODateString
}

export interface BudgetFormValues {
  name: string
  amount: number
  period: BudgetPeriod
  category_id?: UUID
  account_id?: UUID
  start_date: ISODateString
  end_date?: ISODateString
  alert_percentage?: number
}

export interface AccountFormValues {
  name: string
  type: AccountType
  balance?: number
  color?: string
  icon?: string
}

export interface CategoryFormValues {
  name: string
  slug: string
  type: TransactionType
  icon?: string
  color?: string
}
