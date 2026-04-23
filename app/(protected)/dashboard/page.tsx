import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"

export default function DashboardPage() {
  async function signOut() {
    "use server"

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    await supabase.auth.signOut()
    redirect("/sign-in")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-4 p-6 md:p-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
      <p className="text-muted-foreground">You are signed in successfully.</p>
    </main>
  )
}
