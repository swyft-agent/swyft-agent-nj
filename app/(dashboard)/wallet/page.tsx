"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  DollarSign,
  Menu,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface WalletData {
  id: string
  balance: number
  pending_balance: number
  total_deposits: number
  total_withdrawals: number
  total_spent_on_ads: number
  currency: string
  status: string
}

interface Transaction {
  id: string
  amount: number
  transaction_type: "deposit" | "withdrawal" | "ad_spend" | "refund" | "bonus"
  description: string
  status: "pending" | "completed" | "failed" | "cancelled"
  created_at: string
  reference_id?: string
  payment_method?: string
}

export default function WalletPage() {
  const { user } = useAuth()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (user?.id) {
      fetchWalletData()
    }
  }, [user?.id])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error("No authenticated user")
      }

      // Get user data to check if they have a company
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_account_id")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        throw userError
      }

      const isCompanyUser = userData.company_account_id && userData.company_account_id !== "null"

      // Fetch wallet data
      let walletQuery = supabase.from("wallet").select("*")
      if (isCompanyUser) {
        walletQuery = walletQuery.eq("company_account_id", userData.company_account_id)
      } else {
        walletQuery = walletQuery.eq("user_id", user.id)
      }

      const { data: wallet, error: walletError } = await walletQuery.single()

      if (walletError) {
        console.error("Error fetching wallet:", walletError)
        throw walletError
      }

      setWalletData(wallet)

      // Fetch transactions
      let transactionsQuery = supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (isCompanyUser) {
        // For company users, filter by company_account_id
        transactionsQuery = transactionsQuery.eq("company_account_id", userData.company_account_id)
      } else {
        // For individual users, filter by wallet_id
        transactionsQuery = transactionsQuery.eq("wallet_id", wallet.id)
      }

      const { data: transactionData, error: transactionError } = await transactionsQuery

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError)
        throw transactionError
      }

      setTransactions(transactionData || [])
    } catch (err) {
      console.error("Error loading wallet data:", err)
      setError("Failed to load wallet data")
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "bonus":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case "withdrawal":
      case "ad_spend":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case "refund":
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "bonus":
      case "refund":
        return "text-green-600"
      case "withdrawal":
      case "ad_spend":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const formatAmount = (amount: number, type: string) => {
    const sign = ["deposit", "bonus", "refund"].includes(type) ? "+" : "-"
    return `${sign}KSh ${Math.abs(amount).toLocaleString()}`
  }

  const filterTransactions = (type?: string) => {
    if (!type) return transactions
    return transactions.filter((t) => t.transaction_type === type)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please log in to view your wallet.</p>
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
            <SidebarTrigger className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-md">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-gray-900">Wallet</h1>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <SidebarTrigger className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-md">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-gray-900">Wallet</h1>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600 text-center">{error}</p>
              <div className="flex justify-center mt-4">
                <Button onClick={fetchWalletData} variant="outline">
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
            <h1 className="text-lg font-semibold text-gray-900">Wallet</h1>
            <p className="text-xs text-gray-500">Manage your finances</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600 mt-2">Manage your finances and track transactions</p>
        </div>

        {/* Wallet Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">KSh {walletData?.balance?.toLocaleString() || "0"}</div>
              <p className="text-xs text-gray-500 mt-1">{walletData?.currency || "KES"}</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Balance</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                KSh {walletData?.pending_balance?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Processing transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Deposits</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                KSh {walletData?.total_deposits?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">All-time deposits</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ad Spending</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                KSh {walletData?.total_spent_on_ads?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total ad spend</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">Manage your wallet balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start bg-green-600 hover:bg-green-700">
                <Link href="/wallet/deposit">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Money
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/ads/create">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Create Ad
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Wallet Status</CardTitle>
              <CardDescription className="text-gray-600">Current account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <Badge variant={walletData?.status === "active" ? "default" : "destructive"}>
                  {walletData?.status || "Unknown"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Currency</span>
                <span className="text-sm font-medium text-gray-900">{walletData?.currency || "KES"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Transactions</span>
                <span className="text-sm font-medium text-gray-900">{transactions.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Transaction History</CardTitle>
            <CardDescription className="text-gray-600">View and filter your transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">All</TabsTrigger>
                <TabsTrigger value="deposit">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                <TabsTrigger value="ad_spend">Ad Spend</TabsTrigger>
                <TabsTrigger value="refund">Refunds</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions yet</p>
                      <p className="text-sm text-gray-400">Your transaction history will appear here</p>
                    </div>
                  ) : (
                    transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getTransactionIcon(transaction.transaction_type)}
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description || transaction.transaction_type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.created_at).toLocaleDateString()} •{" "}
                              {transaction.payment_method || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                            {formatAmount(transaction.amount, transaction.transaction_type)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {["deposit", "withdrawal", "ad_spend", "refund"].map((type) => (
                <TabsContent key={type} value={type} className="mt-6">
                  <div className="space-y-4">
                    {filterTransactions(type).length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No {type} transactions</p>
                      </div>
                    ) : (
                      filterTransactions(type).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getTransactionIcon(transaction.transaction_type)}
                              {getStatusIcon(transaction.status)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {transaction.description || transaction.transaction_type}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString()} •{" "}
                                {transaction.payment_method || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                              {formatAmount(transaction.amount, transaction.transaction_type)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
