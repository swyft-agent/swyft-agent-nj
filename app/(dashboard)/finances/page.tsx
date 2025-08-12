"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, PieChart, Download, Calendar } from "lucide-react"
import { FinanceCharts } from "@/components/finance-charts"

interface FinancialData {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  monthlyGrowth: number
  recentTransactions: Transaction[]
  monthlyBreakdown: MonthlyData[]
}

interface Transaction {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  date: string
  category: string
  building?: string
}

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
  netIncome: number
}

// Format currency in KSH
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format large numbers with K/M suffix
const formatCurrencyShort = (amount: number) => {
  if (amount >= 1000000) {
    return `KSh ${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `KSh ${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}

export default function FinancesPage() {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    monthlyGrowth: 0,
    recentTransactions: [],
    monthlyBreakdown: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth")

  useEffect(() => {
    fetchFinancialData()
  }, [selectedPeriod])

  const fetchFinancialData = async () => {
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Sample data with KSH amounts
      setFinancialData({
        totalRevenue: 4250000, // KSh 4.25M
        totalExpenses: 1680000, // KSh 1.68M
        netIncome: 2570000, // KSh 2.57M
        monthlyGrowth: 12.5,
        recentTransactions: [
          {
            id: "1",
            type: "income",
            description: "Rent Payment - Westlands Apartment 3B",
            amount: 85000,
            date: "2024-01-15",
            category: "Rent",
            building: "Westlands Complex",
          },
          {
            id: "2",
            type: "expense",
            description: "Maintenance - Plumbing Repair",
            amount: 15000,
            date: "2024-01-14",
            category: "Maintenance",
            building: "Kilimani Tower",
          },
          {
            id: "3",
            type: "income",
            description: "Rent Payment - Karen Heights Unit 12",
            amount: 120000,
            date: "2024-01-13",
            category: "Rent",
            building: "Karen Heights",
          },
          {
            id: "4",
            type: "expense",
            description: "Security Services - Monthly Fee",
            amount: 45000,
            date: "2024-01-12",
            category: "Security",
            building: "All Properties",
          },
          {
            id: "5",
            type: "income",
            description: "Deposit - New Tenant",
            amount: 170000,
            date: "2024-01-11",
            category: "Deposit",
            building: "Parklands Studio",
          },
        ],
        monthlyBreakdown: [
          { month: "Jan", revenue: 4250000, expenses: 1680000, netIncome: 2570000 },
          { month: "Dec", revenue: 3980000, expenses: 1520000, netIncome: 2460000 },
          { month: "Nov", revenue: 4100000, expenses: 1650000, netIncome: 2450000 },
          { month: "Oct", revenue: 3850000, expenses: 1480000, netIncome: 2370000 },
          { month: "Sep", revenue: 3920000, expenses: 1590000, netIncome: 2330000 },
          { month: "Aug", revenue: 3750000, expenses: 1420000, netIncome: 2330000 },
        ],
      })
    } catch (error) {
      console.error("Error fetching financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground">Track your property revenue and expenses</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisQuarter">This Quarter</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrencyShort(financialData.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />+{financialData.monthlyGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrencyShort(financialData.totalExpenses)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              -5.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrencyShort(financialData.netIncome)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +18.7% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((financialData.netIncome / financialData.totalRevenue) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Healthy profit margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed View */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Revenue & Expenses Trend</CardTitle>
            <CardDescription>Monthly financial performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <FinanceCharts />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        transaction.type === "income" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.building} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Financial Breakdown */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="properties">By Property</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Breakdown</CardTitle>
              <CardDescription>Detailed month-by-month financial performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Expenses</th>
                      <th className="text-right p-2">Net Income</th>
                      <th className="text-right p-2">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.monthlyBreakdown.map((month) => (
                      <tr key={month.month} className="border-b">
                        <td className="p-2 font-medium">{month.month} 2024</td>
                        <td className="p-2 text-right text-green-600">{formatCurrency(month.revenue)}</td>
                        <td className="p-2 text-right text-red-600">{formatCurrency(month.expenses)}</td>
                        <td className="p-2 text-right text-blue-600 font-medium">{formatCurrency(month.netIncome)}</td>
                        <td className="p-2 text-right">{((month.netIncome / month.revenue) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Breakdown of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: "Maintenance", amount: 450000, percentage: 26.8 },
                  { category: "Security", amount: 380000, percentage: 22.6 },
                  { category: "Utilities", amount: 320000, percentage: 19.0 },
                  { category: "Management", amount: 280000, percentage: 16.7 },
                  { category: "Insurance", amount: 150000, percentage: 8.9 },
                  { category: "Other", amount: 100000, percentage: 6.0 },
                ].map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Property</CardTitle>
              <CardDescription>Performance breakdown by individual properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { property: "Westlands Complex", revenue: 1200000, units: 8, occupancy: 100 },
                  { property: "Kilimani Tower", revenue: 980000, units: 6, occupancy: 83 },
                  { property: "Karen Heights", revenue: 850000, units: 5, occupancy: 100 },
                  { property: "Parklands Studio", revenue: 720000, units: 4, occupancy: 75 },
                  { property: "Lavington Apartments", revenue: 500000, units: 3, occupancy: 67 },
                ].map((property) => (
                  <div key={property.property} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{property.property}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.units} units • {property.occupancy}% occupied
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(property.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(property.revenue / property.units)}/unit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
