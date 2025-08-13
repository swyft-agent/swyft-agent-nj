"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Building2, Home, Users, Bell, Plus, TrendingUp, DollarSign, Menu, ArrowRight, Truck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { fetchDashboardStats, type DashboardStats } from "@/lib/supabase-data"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadDashboardStats()
    }
  }, [user?.id])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDashboardStats()
      setStats(data)
    } catch (err) {
      console.error("Error loading dashboard stats:", err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 text-gray-600">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 text-gray-600">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600 text-center">{error}</p>
              <div className="flex justify-center mt-4">
                <Button onClick={loadDashboardStats} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
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

        {/* Key Metrics - Mobile: 2x2 grid, Desktop: 4 columns */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Link href="/buildings">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Buildings</CardTitle>
                <Building2 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalBuildings || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Properties managed</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vacant-units">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Vacant Units</CardTitle>
                <Home className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.vacantUnits || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Available for rent/sale</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tenants">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Tenants</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalTenants || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Active tenants</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/notices">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Notices</CardTitle>
                <Bell className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.pendingInquiries || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Active notices</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start bg-green-600 hover:bg-green-700">
                <Link href="/new-vacant-unit">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vacant Unit
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/new-building">
                  <Building2 className="h-4 w-4 mr-2" />
                  Add Building
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/request-move">
                  <Truck className="h-4 w-4 mr-2" />
                  Request Move
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600">Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTransactions.slice(0, 3).map((transaction, index) => (
                    <div
                      key={transaction.id || index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description || "Transaction"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {transaction.transaction_type || "N/A"}
                      </Badge>
                    </div>
                  ))}
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href="/finances/transactions">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Performance Overview</CardTitle>
              <CardDescription className="text-gray-600">Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Occupancy Rate</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.occupancyRate ? `${stats.occupancyRate.toFixed(1)}%` : "0%"}
                  </span>
                  <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Revenue</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    KSh {stats?.monthlyRevenue?.toLocaleString() || "0"}
                  </span>
                  <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Rate</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">95%</span>
                  <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/analytics/revenue">
                  View Analytics <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/vacant-units">
              <CardContent className="p-6 text-center">
                <Home className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Vacant Units</h3>
                <p className="text-sm text-gray-600">Manage available properties</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/inquiries">
              <CardContent className="p-6 text-center">
                <Bell className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Inquiries</h3>
                <p className="text-sm text-gray-600">Respond to customer questions</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/request-move">
              <CardContent className="p-6 text-center">
                <Truck className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Request Move</h3>
                <p className="text-sm text-gray-600">Schedule moving services</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/finances/transactions">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Transactions</h3>
                <p className="text-sm text-gray-600">View financial records</p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
