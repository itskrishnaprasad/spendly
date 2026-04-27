import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/(protected)/_components/app-sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createClient } from "@/utils/supabase/server"
import { getProfile } from "@/utils/services/profile.service"

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/sign-in")
  }

  const profileResult = await getProfile(supabase, user.id)
  const profile = profileResult.success ? profileResult.data : null

  const sidebarUser = {
    name: profile?.full_name || user.email?.split("@")[0] || "User",
    email: profile?.email || user.email || "",
    avatar: profile?.avatar_url || "",
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={sidebarUser} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex flex-1 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DynamicBreadcrumb />
            </div>
            <div className="flex items-center px-4">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
