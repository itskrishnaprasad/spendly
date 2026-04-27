"use client"

import * as React from "react"

import { NavMain } from "@/app/(protected)/_components/nav-main"
import { NavUser } from "@/app/(protected)/_components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Building2Icon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  ArrowLeftRightIcon,
  TagsIcon,
  WalletCardsIcon,
  RepeatIcon,
} from "lucide-react"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Categories",
    url: "/dashboard/categories",
    icon: <TagsIcon />,
  },
  {
    title: "Accounts",
    url: "/dashboard/accounts",
    icon: <Building2Icon />,
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: <ArrowLeftRightIcon />,
  },
  {
    title: "Budgets",
    url: "/dashboard/budgets",
    icon: <WalletCardsIcon />,
  },
  {
    title: "Recurring",
    url: "/dashboard/recurring-transactions",
    icon: <RepeatIcon />,
  },
]

type UserProp = {
  name: string
  email: string
  avatar: string
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: UserProp }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GalleryVerticalEndIcon />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">spendly</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              Financial app
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
