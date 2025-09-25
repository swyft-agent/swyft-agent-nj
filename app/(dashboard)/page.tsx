"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Building2,
  Home,
  Users,
  Bell,
  Plus,
  TrendingUp,
  MessageSquare,
  FileText,
  Truck,
  Calendar,
  DollarSign,
  Menu,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

interface DashboardStats {
  totalBuildings: number
  vacantUnits: number
  totalTenants: number
  totalNotices: number
  recentInquiries: number
  monthlyRevenue: number
}

interface RecentActivity {
  id: string
  type: "inquiry" | "tenant" | "notice" | "building"
  title: string
  description: string
  timestamp: string
  status?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalBuildings: 0,
    vacantUnits: 0,
    totalTenants: 0,
    totalNotices: 0,
    recentInquiries: 0,
    monthlyRevenue: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("agent")

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      // Get user role and company info
      const { data: userData } = await supabase
        .from("users")
        .select("role, company_account_id")
        .eq("id", user?.id)
        .single()

      if (userData) {
        setUserRole(userData.role || "agent")
      }

      const companyId = userData?.company_account_id

      if (!companyId) {
        console.log("No company account found")
        setLoading(false)
        return
      }

      // Load stats based on user role
      const [buildingsData, vacantUnitsData, tenantsData, noticesData, inquiriesData] = await Promise.all([
        // Buildings
        supabase
          .from("buildings")
          .select("building_id")
          .eq("company_account_id", companyId),
        // Vacant units
        supabase
          .from("vacant_units")
          .select("id")
          .eq("company_account_id", companyId),
        // Tenants
        supabase
          .from("tenants")
          .select("id, monthly_rent")
          .eq("company_account_id", companyId),
        // Notices
        supabase
          .from("notices")
          .select("id")
          .eq("company_account_id", companyId),
        // Recent inquiries
        supabase
          .from("inquiries")
          .select("id")
          .eq("company_account_id", companyId)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ])

      // Calculate monthly revenue from tenants
      const monthlyRevenue = tenantsData.data?.reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0) || 0

      setStats({
        totalBuildings: buildingsData.data?.length || 0,
        vacantUnits: vacantUnitsData.data?.length || 0,
        totalTenants: tenantsData.data?.length || 0,
        totalNotices: noticesData.data?.length || 0,
        recentInquiries: inquiriesData.data?.length || 0,
        monthlyRevenue,
      })

      // Load recent activity
      const activities: RecentActivity[] = []

      // Add recent inquiries
      if (inquiriesData.data && inquiriesData.data.length > 0) {
        activities.push({
          id: "inquiries",
          type: "inquiry",
          title: "New Inquiries",
          description: `${inquiriesData.data.length} new inquiries this week`,
          timestamp: "Recent",
          status: "new",
        })
      }

      // Add recent tenants
      if (tenantsData.data && tenantsData.data.length > 0) {
        activities.push({
          id: "tenants",
          type: "tenant",
          title: "Active Tenants",
          description: `${tenantsData.data.length} tenants currently managed`,
          timestamp: "Current",
          status: "active",
        })
      }

      // Add vacant units if any
      if (vacantUnitsData.data && vacantUnitsData.data.length > 0) {
        activities.push({
          id: "vacant",
          type: "building",
          title: "Vacant Units",
          description: `${vacantUnitsData.data.length} units available for rent`,
          timestamp: "Available",
          status: "vacant",
        })
      }

      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getQuickActions = () => {
    const baseActions = [
      {
        title: "Add Vacant Unit",
        description: "List a new property unit",
        icon: Plus,
        href: "/new-vacant-unit",
        color: "bg-blue-500",
      },
      {
        title: "Request Move",
        description: "Request moving services",
        icon: Truck,
        href: "/request-move",
        color: "bg-green-500",
      },
    ]

    if (userRole === "admin" || userRole === "manager") {
      return [
        {
          title: "Add Building",
          description: "Register a new property",
          icon: Building2,
          href: "/new-building",
          color: "bg-purple-500",
        },
        {
          title: "Add Tenant",
          description: "Register a new tenant",
          icon: Users,
          href: "/tenants/add",
          color: "bg-orange-500",
        },
        ...baseActions,
      ]
    }

    if (userRole === "landlord") {
      return [
        {
          title: "Add Building",
          description: "Register a new property",
          icon: Building2,
          href: "/new-building",
          color: "bg-purple-500",
        },
        {
          title: "Add Tenant",
          description: "Register a new tenant",
          icon: Users,
          href: "/tenants/add",
          color: "bg-orange-500",
        },
        ...baseActions,
      ]
    }

    return baseActions
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please log in to view your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-md">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500">Welcome back, {user.email}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.email}</p>
        </div>

        {/* Stats Cards - Mobile: 2x2 Grid, Desktop: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/buildings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBuildings}</div>
                <p className="text-xs text-muted-foreground">Properties managed</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vacant-units">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vacant Units</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vacantUnits}</div>
                <p className="text-xs text-muted-foreground">Available for rent</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tenants">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTenants}</div>
                <p className="text-xs text-muted-foreground">Active leases</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/notices">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notices</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalNotices}</div>
                <p className="text-xs text-muted-foreground">Active notices</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Quick Actions */}
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {getQuickActions().map((action) => (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-center space-x-4 rounded-md border p-4 hover:bg-accent cursor-pointer transition-colors">
                    <div className={`p-2 rounded-md ${action.color}`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-full lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {activity.type === "inquiry" && <MessageSquare className="h-4 w-4" />}
                        {activity.type === "tenant" && <Users className="h-4 w-4" />}
                        {activity.type === "notice" && <Bell className="h-4 w-4" />}
                        {activity.type === "building" && <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Overview */}
        {(userRole === "admin" || userRole === "manager" || userRole === "landlord") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
              <CardDescription>Monthly revenue from all properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">KES {stats.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Monthly rental income</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/analytics/revenue">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link href="/finances">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Financial Reports
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
