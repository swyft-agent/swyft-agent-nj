"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Search,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  Building,
  User,
  Menu,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

interface Transaction {
  id: string
  type: "income" | "expense"
  category: string
  amount: number
  description: string
  date: string
  tenant_name?: string
  property_name?: string
  status: "completed" | "pending" | "failed"
  reference?: string
}

// Helper function to validate UUID
function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid || uuid === "null" || uuid === "" || uuid === "undefined") {
    return false
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("30d")

  useEffect(() => {
    if (user?.id) {
      loadTransactions()
    }
  }, [user?.id, dateRange])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, typeFilter, statusFilter])

  const loadTransactions = async () => {
    if (!user?.id || !isValidUUID(user.id)) return

    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      switch (dateRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(endDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(endDate.getDate() - 90)
          break
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Get user's company info
      const { data: userData } = await supabase
        .from("users")
        .select("company_account_id, role")
        .eq("id", user.id)
        .single()

      const companyId = userData?.company_account_id
      const isCompanyUser = companyId && isValidUUID(companyId)

      // Try to fetch from wallet_transactions table first
      let walletTransactions: any[] = []
      try {
        const walletQuery = supabase
          .from("wallet_transactions")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false })

        if (isCompanyUser) {
          walletQuery.eq("company_account_id", companyId)
        } else {
          walletQuery.eq("user_id", user.id)
        }

        const { data: walletData, error: walletError } = await walletQuery

        if (!walletError && walletData) {
          walletTransactions = walletData
        }
      } catch (error) {
        console.log("Wallet transactions table not available, using sample data")
      }

      // Try to fetch from payments table
      let paymentTransactions: any[] = []
      try {
        const paymentsQuery = supabase
          .from("payments")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false })

        if (isCompanyUser) {
          paymentsQuery.eq("company_account_id", companyId)
        } else {
          paymentsQuery.eq("user_id", user.id)
        }

        const { data: paymentsData, error: paymentsError } = await paymentsQuery

        if (!paymentsError && paymentsData) {
          paymentTransactions = paymentsData
        }
      } catch (error) {
        console.log("Payments table not available, using sample data")
      }

      // Try to fetch from expenses table
      let expenseTransactions: any[] = []
      try {
        const expensesQuery = supabase
          .from("expenses")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false })

        if (isCompanyUser) {
          expensesQuery.eq("company_account_id", companyId)
        } else {
          expensesQuery.eq("user_id", user.id)
        }

        const { data: expensesData, error: expensesError } = await expensesQuery

        if (!expensesError && expensesData) {
          expenseTransactions = expensesData
        }
      } catch (error) {
        console.log("Expenses table not available, using sample data")
      }

      // Combine and format transactions
      const allTransactions: Transaction[] = []

      // Add wallet transactions
      walletTransactions.forEach((transaction) => {
        allTransactions.push({
          id: transaction.id,
          type: transaction.type === "deposit" ? "income" : "expense",
          category: transaction.type === "deposit" ? "Wallet Deposit" : "Wallet Withdrawal",
          amount: Math.abs(transaction.amount || 0),
          description: transaction.description || `${transaction.type} transaction`,
          date: transaction.created_at,
          status: transaction.status || "completed",
          reference: transaction.reference,
        })
      })

      // Add payment transactions
      paymentTransactions.forEach((payment) => {
        allTransactions.push({
          id: payment.id,
          type: "income",
          category: "Rent Payment",
          amount: payment.amount || 0,
          description: payment.description || "Rent payment received",
          date: payment.created_at,
          tenant_name: payment.tenant_name,
          property_name: payment.property_name,
          status: payment.status || "completed",
          reference: payment.reference,
        })
      })

      // Add expense transactions
      expenseTransactions.forEach((expense) => {
        allTransactions.push({
          id: expense.id,
          type: "expense",
          category: expense.category || "General Expense",
          amount: expense.amount || 0,
          description: expense.description || "Business expense",
          date: expense.created_at,
          property_name: expense.property_name,
          status: expense.status || "completed",
          reference: expense.reference,
        })
      })

      // If no real transactions, generate sample data
      if (allTransactions.length === 0) {
        const sampleTransactions: Transaction[] = [
          {
            id: "1",
            type: "income",
            category: "Rent Payment",
            amount: 45000,
            description: "Monthly rent payment",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            tenant_name: "John Doe",
            property_name: "Sunset Apartments",
            status: "completed",
            reference: "REF001",
          },
          {
            id: "2",
            type: "expense",
            category: "Maintenance",
            amount: 8500,
            description: "Plumbing repair",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            property_name: "Sunset Apartments",
            status: "completed",
            reference: "REF002",
          },
          {
            id: "3",
            type: "income",
            category: "Service Charge",
            amount: 5000,
            description: "Monthly service charge",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            tenant_name: "Jane Smith",
            property_name: "Green Valley",
            status: "completed",
            reference: "REF003",
          },
          {
            id: "4",
            type: "expense",
            category: "Utilities",
            amount: 12000,
            description: "Electricity bill",
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            property_name: "Green Valley",
            status: "pending",
            reference: "REF004",
          },
          {
            id: "5",
            type: "income",
            category: "Deposit",
            amount: 90000,
            description: "Security deposit",
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            tenant_name: "Mike Johnson",
            property_name: "City Heights",
            status: "completed",
            reference: "REF005",
          },
        ]
        allTransactions.push(...sampleTransactions)
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setTransactions(allTransactions)
    } catch (error) {
      console.error("Error loading transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === typeFilter)
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    setFilteredTransactions(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTotalIncome = () => {
    return filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  }

  const getTotalExpenses = () => {
    return filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  }

  const getNetIncome = () => {
    return getTotalIncome() - getTotalExpenses()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <p>Please log in to view transactions.</p>
            </CardContent>
          </Card>
        </div>
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
            <h1 className="text-lg font-semibold text-gray-900">Transactions</h1>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-md">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-gray-900">Transactions</h1>
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">Track all your financial transactions</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">KSh {getTotalIncome().toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTransactions.filter((t) => t.type === "income").length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">KSh {getTotalExpenses().toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTransactions.filter((t) => t.type === "expense").length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getNetIncome() >= 0 ? "text-green-600" : "text-red-600"}`}>
                KSh {getNetIncome().toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">{filteredTransactions.length} total transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
            <CardDescription className="text-gray-600">
              {filteredTransactions.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{transaction.category}</span>
                          {transaction.tenant_name && (
                            <>
                              <span>•</span>
                              <User className="h-3 w-3" />
                              <span>{transaction.tenant_name}</span>
                            </>
                          )}
                          {transaction.property_name && (
                            <>
                              <span>•</span>
                              <Building className="h-3 w-3" />
                              <span>{transaction.property_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          transaction.type === "income" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}KSh {transaction.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      {transaction.reference && (
                        <p className="text-xs text-gray-400 mt-1">Ref: {transaction.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new transaction</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
