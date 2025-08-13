"use client"

import type * as React from "react"
import {
  Building2,
  Home,
  Bell,
  Plus,
  Settings,
  User,
  ChevronUp,
  LogOut,
  BarChart3,
  Menu,
  Users,
  FileText,
  TrendingUp,
  Truck,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useState, useEffect } from "react"

interface UserProfile {
  role?: string
  name?: string
  email?: string
  company_account_id?: string
  is_company_owner?: boolean
  company_accounts?: {
    company_name?: string
    contact_name?: string
  }
}

// Menu items for different user roles
const getMenuItems = (userRole: string) => {
  const baseItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
  ]

  const propertyItems = {
    title: "Properties",
    items: [
      {
        title: "Vacant Units",
        url: "/vacant-units",
        icon: Home,
      },
      {
        title: "Add New Unit",
        url: "/new-vacant-unit",
        icon: Plus,
      },
    ],
  }

  const servicesItems = {
    title: "Services",
    items: [
      {
        title: "Request Move",
        url: "/request-move",
        icon: Truck,
      },
    ],
  }

  const basicAnalytics = {
    title: "Analytics",
    items: [
      {
        title: "Performance",
        url: "/analytics",
        icon: BarChart3,
      },
    ],
  }

  const settingsItems = {
    title: "Settings",
    items: [
      {
        title: "Account Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  }

  // Role-specific menu configurations
  switch (userRole) {
    case "agent":
      return [...baseItems, propertyItems, servicesItems, basicAnalytics, settingsItems]

    case "landlord":
      return [
        ...baseItems,
        {
          title: "Properties",
          items: [
            {
              title: "My Properties",
              url: "/buildings",
              icon: Building2,
            },
            {
              title: "Add Building",
              url: "/new-building",
              icon: Plus,
            },
            {
              title: "Vacant Units",
              url: "/vacant-units",
              icon: Home,
            },
            {
              title: "Add New Unit",
              url: "/new-vacant-unit",
              icon: Plus,
            },
          ],
        },
        {
          title: "Tenants",
          items: [
            {
              title: "All Tenants",
              url: "/tenants",
              icon: Users,
            },
            {
              title: "Add Tenant",
              url: "/tenants/add",
              icon: Plus,
            },
          ],
        },
        {
          title: "Financial Documents",
          items: [
            {
              title: "Invoices",
              url: "/finances/invoices",
              icon: FileText,
            },
            {
              title: "Receipts",
              url: "/finances/receipts",
              icon: FileText,
            },
          ],
        },
        servicesItems,
        basicAnalytics,
        settingsItems,
      ]

    case "admin":
    case "manager":
      return [
        ...baseItems,
        {
          title: "Properties",
          items: [
            {
              title: "Buildings",
              url: "/buildings",
              icon: Building2,
            },
            {
              title: "Add Building",
              url: "/new-building",
              icon: Plus,
            },
            {
              title: "Vacant Units",
              url: "/vacant-units",
              icon: Home,
            },
            {
              title: "Add New Unit",
              url: "/new-vacant-unit",
              icon: Plus,
            },
          ],
        },
        {
          title: "Tenants & Leases",
          items: [
            {
              title: "All Tenants",
              url: "/tenants",
              icon: Users,
            },
            {
              title: "Add Tenant",
              url: "/tenants/add",
              icon: Plus,
            },
            {
              title: "Notices",
              url: "/notices",
              icon: Bell,
            },
            {
              title: "Invoices",
              url: "/finances/invoices",
              icon: FileText,
            },
            {
              title: "Receipts",
              url: "/finances/receipts",
              icon: FileText,
            },
          ],
        },
        {
          title: "Financial Management",
          items: [
            {
              title: "Finances",
              url: "/finances",
              icon: TrendingUp,
            },
            {
              title: "Transactions",
              url: "/finances/transactions",
              icon: FileText,
            },
          ],
        },
        {
          title: "Reports & Analytics",
          items: [
            {
              title: "Revenue Reports",
              url: "/analytics/revenue",
              icon: TrendingUp,
            },
          ],
        },
        {
          title: "Team Management",
          items: [
            {
              title: "Team Members",
              url: "/admin",
              icon: Users,
            },
            {
              title: "Roles & Permissions",
              url: "/admin/roles",
              icon: Settings,
            },
          ],
        },
        servicesItems,
        settingsItems,
      ]

    default:
      return [...baseItems, propertyItems, servicesItems, settingsItems]
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return

      try {
        // Get the user's basic info and role from users table with company info if available
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(`
            role,
            name,
            email,
            company_account_id,
            is_company_owner,
            company_accounts (
              company_name,
              contact_name
            )
          `)
          .eq("id", user.id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          return
        }

        setUserProfile(userData)
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  // Determine user role
  const userRole = userProfile?.role || "agent"
  const menuItems = getMenuItems(userRole)

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "agent":
        return "Real Estate Agent"
      case "landlord":
        return "Property Landlord"
      case "admin":
        return "Property Management"
      case "manager":
        return "Property Manager"
      default:
        return "User"
    }
  }

  // Get display name - prefer company contact name, then user name, then fallback
  const getDisplayName = () => {
    if (userProfile?.company_accounts?.contact_name) {
      return userProfile.company_accounts.contact_name
    }
    if (userProfile?.name) {
      return userProfile.name
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    return user?.email || "User"
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white shadow-sm" {...props}>
      <SidebarHeader className="border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 px-2 py-2">
          <Building2 className="h-6 w-6 text-green-600" />
          <span className="font-semibold text-gray-900">Swyft Agent</span>
        </div>
        {/* Mobile menu trigger - visible on small screens */}
        <div className="md:hidden flex justify-end p-2">
          <SidebarTrigger className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        {menuItems.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-gray-600 font-medium">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.url ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-800"
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  item.items?.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton
                        asChild
                        className="hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-800"
                      >
                        <Link href={subItem.url}>
                          {subItem.icon && <subItem.icon className="h-4 w-4" />}
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-green-50 data-[state=open]:text-green-700 hover:bg-green-50 hover:text-green-700"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-gray-900">{getDisplayName()}</span>
                    <span className="truncate text-xs text-gray-500">
                      {loading ? "Loading..." : getRoleDisplayName(userRole)}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-gray-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-white border border-gray-200 shadow-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild className="hover:bg-green-50">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="hover:bg-red-50 text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
