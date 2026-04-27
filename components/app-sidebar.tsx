"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
