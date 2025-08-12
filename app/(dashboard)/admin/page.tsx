"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Building, DollarSign, Activity, Shield, ShieldCheck } from "lucide-react"
import { AddAgentModal } from "@/components/add-agent-modal"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { getCachedData, CACHE_KEYS } from "@/lib/cache"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { hasAdminPermission, type AccessPayload } from "@/lib/supabase-admin"

export default function AdminPage() {
  const { user: authUser } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [financials, setFinancials] = useState<any>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Resolve admin access from profile: role OR owner OR permissions include admin
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        if (!authUser?.id) {
          setIsAdmin(false)
          return
        }
        const { data: me, error } = await supabase
          .from("users")
          .select("role, is_company_owner, company_account_id, access")
          .eq("id", authUser.id)
          .maybeSingle()
        if (error) throw error

        const role = (me?.role || "").toLowerCase()
        const owner = Boolean(me?.is_company_owner)
        const access = (me?.access as AccessPayload) || null
        const adminByRole = role === "admin"
        const adminByAccess = hasAdminPermission(access)

        setCompanyId(me?.company_account_id ?? null)
        setIsAdmin(owner || adminByRole || adminByAccess)
      } catch (e) {
        // default to restricted if we fail to resolve
        setIsAdmin(false)
        // eslint-disable-next-line no-console
        console.error("Failed to resolve admin access", e)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [authUser?.id])

  useEffect(() => {
    const loadAdminData = async () => {
      if (!companyId) return
      try {
        // Pull basic analytics, leave as-is with your existing cache helpers
        const analyticsData = await getCachedData(
          CACHE_KEYS.ANALYTICS(companyId),
          async () => {
            const [tenantsResult, buildingsResult, unitsResult] = await Promise.all([
              supabase.from("tenants").select("*").eq("company_account_id", companyId),
              supabase.from("buildings").select("*").eq("company_account_id", companyId),
              supabase.from("vacant_units").select("*").eq("company_account_id", companyId),
            ])
            const tenants = tenantsResult.data || []
            const buildings = buildingsResult.data || []
            const units = unitsResult.data || []
            const totalTenants = tenants.length
            const totalBuildings = buildings.length
            const totalUnits = units.length
            const occupiedUnits = tenants.filter((t) => t.status === "active").length
            const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

            const tenantStatusData = [
              { name: "Active", value: tenants.filter((t) => t.status === "active").length, color: "#10b981" },
              { name: "Moving Out", value: tenants.filter((t) => t.status === "moving-out").length, color: "#f59e0b" },
              { name: "Moved Out", value: tenants.filter((t) => t.status === "moved-out").length, color: "#ef4444" },
            ]

            const monthlyTrends = [
              { month: "Jan", tenants: 45, revenue: 450000, occupancy: 85 },
              { month: "Feb", tenants: 52, revenue: 520000, occupancy: 88 },
              { month: "Mar", tenants: 48, revenue: 480000, occupancy: 82 },
              { month: "Apr", tenants: 61, revenue: 610000, occupancy: 92 },
              { month: "May", tenants: 55, revenue: 550000, occupancy: 89 },
              {
                month: "Jun",
                tenants: totalTenants,
                revenue: totalTenants * 10000,
                occupancy: Math.round(occupancyRate),
              },
            ]

            return {
              totalTenants,
              totalBuildings,
              totalUnits,
              occupiedUnits,
              occupancyRate,
              tenantStatusData,
              monthlyTrends,
            }
          },
          5 * 60 * 1000,
        )

        const financialData = await getCachedData(
          CACHE_KEYS.FINANCIALS(companyId),
          async () => {
            const [expensesResult, paymentsResult] = await Promise.all([
              supabase.from("expenses").select("*").eq("company_account_id", companyId),
              supabase.from("payments").select("*").eq("company_account_id", companyId),
            ])
            const expenses = expensesResult.data || []
            const payments = paymentsResult.data || []
            let monthlyRevenue, totalRevenue, totalExpenses, totalProfit

            if (payments.length > 0 || expenses.length > 0) {
              const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
              const totalExpensesAmount = expenses.reduce((sum, x) => sum + (x.amount || 0), 0)
              monthlyRevenue = [
                {
                  month: "Current",
                  revenue: totalPayments,
                  expenses: totalExpensesAmount,
                  profit: totalPayments - totalExpensesAmount,
                },
              ]
              totalRevenue = totalPayments
              totalExpenses = totalExpensesAmount
              totalProfit = totalRevenue - totalExpenses
            } else {
              monthlyRevenue = [
                { month: "Jan", revenue: 450000, expenses: 120000, profit: 330000 },
                { month: "Feb", revenue: 520000, expenses: 135000, profit: 385000 },
                { month: "Mar", revenue: 480000, expenses: 125000, profit: 355000 },
                { month: "Apr", revenue: 610000, expenses: 150000, profit: 460000 },
                { month: "May", revenue: 550000, expenses: 140000, profit: 410000 },
                { month: "Jun", revenue: 670000, expenses: 160000, profit: 510000 },
              ]
              totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)
              totalExpenses = monthlyRevenue.reduce((s, m) => s + m.expenses, 0)
              totalProfit = totalRevenue - totalExpenses
            }

            return { monthlyRevenue, totalRevenue, totalExpenses, totalProfit }
          },
          5 * 60 * 1000,
        )

        setAnalytics(analyticsData)
        setFinancials(financialData)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error loading admin data", e)
      }
    }
    if (isAdmin) {
      loadAdminData()
    }
  }, [isAdmin, companyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md border-none shadow-sm">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have admin rights. Please contact your administrator for access.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Company analytics and system management</p>
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Admin access confirmed</AlertTitle>
            <AlertDescription>You have full access to the admin panel.</AlertDescription>
          </Alert>
        </div>
        <div className="flex gap-2">
          {/* Keep your existing AddAgentModal API integration */}
          <AddAgentModal
            onAgentAdded={() => {
              /* optionally refresh analytics */
            }}
            trigger={<Button>Add Agent</Button>}
          />
          <Badge variant="outline" className="bg-primary/10">
            <Shield className="mr-1 h-3 w-3" />
            Admin Access
          </Badge>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTenants}</div>
              <p className="text-xs text-muted-foreground">{analytics.occupiedUnits} active</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalBuildings}</div>
              <p className="text-xs text-muted-foreground">{analytics.totalUnits} total units</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.occupancyRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.occupiedUnits}/{analytics.totalUnits} occupied
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSh {analytics.monthlyTrends?.[analytics.monthlyTrends.length - 1]?.revenue?.toLocaleString?.() || "—"}
              </div>
              <p className="text-xs text-green-600">Updated</p>
            </CardContent>
          </Card>
        </div>
      )}

      {financials && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">KSh {financials.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last period</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">KSh {financials.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last period</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">KSh {financials.totalProfit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last period</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
