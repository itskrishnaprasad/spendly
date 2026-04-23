import type { Profile } from "@/types/base"
import type {
  CreateAccount,
  CreateBudget,
  CreateCategory,
  CreateRecurringTransaction,
  CreateTransaction,
} from "@/types/create"

export type UpdateProfile = Partial<
  Pick<Profile, "full_name" | "avatar_url" | "currency" | "timezone">
>

export type UpdateAccount = Partial<CreateAccount>

export type UpdateCategory = Partial<CreateCategory>

export type UpdateTransaction = Partial<CreateTransaction>

export type UpdateBudget = Partial<CreateBudget>

export type UpdateRecurringTransaction = Partial<CreateRecurringTransaction>
