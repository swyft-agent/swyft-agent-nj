"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp,
  Download,
  Mail,
  DollarSign,
  Building,
  Users,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueData {
  month: string
  revenue: number
  expenses: number
  netIncome: number
}

interface LandlordUser {
  id: string
  name: string
  email: string
  company_name: string
}

interface ReportData {
  rentalIncome: number
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  occupancyRate: number
  expenses: {
    maintenance: number
    utilities: number
    salaries: number
    other: number
    total: number
  }
  repairsSummary: {
    completed: number
    ongoing: number
    upcoming: number
    details: string[]
  }
  marketingUpdates: {
    newVacancies: number
    inquiries: number
    viewings: number
  }
  netIncome: number
  period: string
}

export default function RevenueReportsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [landlords, setLandlords] = useState<LandlordUser[]>([])
  const [selectedLandlord, setSelectedLandlord] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [reportData, setReportData] = useState<ReportData | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadRevenueData()
      loadLandlords()
    }
  }, [user?.id])

  useEffect(() => {
    if (selectedMonth) {
      generateReportData()
    }
  }, [selectedMonth])

  const loadRevenueData = async () => {
    try {
      setLoading(true)

      // Get user's company ID
      const { data: userData } = await supabase.from("users").select("company_account_id").eq("id", user?.id).single()

      if (!userData?.company_account_id) {
        console.log("No company account found")
        return
      }

      // Generate mock revenue data for the last 12 months
      const months = []
      const currentDate = new Date()

      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthStr = date.toISOString().slice(0, 7)

        // Get actual revenue data from vacant_units
        const { data: units } = await supabase
          .from("vacant_units")
          .select("rent_amount")
          .eq("company_account_id", userData.company_account_id)
          .eq("status", "occupied")

        // Get expenses from wallet_transactions
        const { data: expenses } = await supabase
          .from("wallet_transactions")
          .select("amount")
          .eq("company_account_id", userData.company_account_id)
          .eq("transaction_type", "expense")
          .gte("created_at", `${monthStr}-01`)
          .lt("created_at", `${monthStr}-31`)

        const revenue = units?.reduce((sum, unit) => sum + (Number.parseFloat(unit.rent_amount) || 0), 0) || 0
        const totalExpenses = expenses?.reduce((sum, exp) => sum + Math.abs(Number.parseFloat(exp.amount) || 0), 0) || 0

        months.push({
          month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue,
          expenses: totalExpenses,
          netIncome: revenue - totalExpenses,
        })
      }

      setRevenueData(months)
    } catch (error) {
      console.error("Error loading revenue data:", error)
      setMessage({ type: "error", text: "Failed to load revenue data" })
    } finally {
      setLoading(false)
    }
  }

  const loadLandlords = async () => {
    try {
      // Get users with landlord role
      const { data: landlordUsers, error } = await supabase
        .from("users")
        .select("id, name, email, company_name, contact_name")
        .eq("role", "landlord")

      if (error) {
        console.error("Error loading landlords:", error)
        return
      }

      const formattedLandlords =
        landlordUsers?.map((landlord) => ({
          id: landlord.id,
          name: landlord.name || landlord.contact_name || "Unknown",
          email: landlord.email,
          company_name: landlord.company_name || "No Company",
        })) || []

      setLandlords(formattedLandlords)
    } catch (error) {
      console.error("Error loading landlords:", error)
    }
  }

  const generateReportData = async () => {
    try {
      if (!user?.id || !selectedMonth) return

      // Get user's company ID
      const { data: userData } = await supabase.from("users").select("company_account_id").eq("id", user.id).single()

      if (!userData?.company_account_id) return

      const companyId = userData.company_account_id
      const startDate = `${selectedMonth}-01`
      const endDate = `${selectedMonth}-31`

      // Get rental income from vacant_units
      const { data: units } = await supabase
        .from("vacant_units")
        .select("rent_amount, status")
        .eq("company_account_id", companyId)

      const totalUnits = units?.length || 0
      const occupiedUnits = units?.filter((unit) => unit.status === "occupied").length || 0
      const vacantUnits = totalUnits - occupiedUnits
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
      const rentalIncome =
        units?.reduce((sum, unit) => {
          if (unit.status === "occupied") {
            return sum + (Number.parseFloat(unit.rent_amount) || 0)
          }
          return sum
        }, 0) || 0

      // Get expenses from wallet_transactions
      const { data: transactions } = await supabase
        .from("wallet_transactions")
        .select("amount, description, transaction_type")
        .eq("company_account_id", companyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      const expenses = {
        maintenance: 0,
        utilities: 0,
        salaries: 0,
        other: 0,
        total: 0,
      }

      transactions?.forEach((transaction) => {
        if (transaction.transaction_type === "expense") {
          const amount = Math.abs(Number.parseFloat(transaction.amount) || 0)
          const description = transaction.description?.toLowerCase() || ""

          if (description.includes("maintenance") || description.includes("repair")) {
            expenses.maintenance += amount
          } else if (
            description.includes("utility") ||
            description.includes("electricity") ||
            description.includes("water")
          ) {
            expenses.utilities += amount
          } else if (description.includes("salary") || description.includes("wage")) {
            expenses.salaries += amount
          } else {
            expenses.other += amount
          }
          expenses.total += amount
        }
      })

      // Get inquiries for marketing updates
      const { data: inquiries } = await supabase
        .from("inquiries")
        .select("id")
        .eq("company_account_id", companyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      const reportData: ReportData = {
        rentalIncome,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
        expenses,
        repairsSummary: {
          completed: 0,
          ongoing: 0,
          upcoming: 0,
          details: ["No repair data available"],
        },
        marketingUpdates: {
          newVacancies: vacantUnits,
          inquiries: inquiries?.length || 0,
          viewings: 0,
        },
        netIncome: rentalIncome - expenses.total,
        period: selectedMonth,
      }

      setReportData(reportData)
    } catch (error) {
      console.error("Error generating report data:", error)
    }
  }

  const downloadReport = () => {
    if (!reportData) return

    const reportHtml = generateReportHTML(reportData)
    const blob = new Blob([reportHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `revenue-report-${reportData.period}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sendReport = async () => {
    if (!reportData || !selectedLandlord) {
      setMessage({ type: "error", text: "Please select a landlord and ensure report data is loaded" })
      return
    }

    try {
      setSending(true)

      const landlord = landlords.find((l) => l.id === selectedLandlord)
      if (!landlord) {
        setMessage({ type: "error", text: "Selected landlord not found" })
        return
      }

      const reportHtml = generateReportHTML(reportData)

      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: landlord.email,
          landlordName: landlord.name,
          reportHtml,
          period: reportData.period,
          companyId: user?.company_account_id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send report")
      }

      setMessage({ type: "success", text: `Report sent successfully to ${landlord.email}` })
    } catch (error: any) {
      console.error("Error sending report:", error)
      setMessage({ type: "error", text: error.message || "Failed to send report" })
    } finally {
      setSending(false)
    }
  }

  const generateReportHTML = (data: ReportData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Revenue Report - ${data.period}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .amount { font-size: 1.2em; font-weight: bold; color: #2563eb; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Monthly Revenue Report</h1>
          <p>Period: ${new Date(data.period).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>

        <div class="section">
          <h2>Rental Income Summary</h2>
          <div class="grid">
            <div class="card">
              <h3>Total Rental Income</h3>
              <div class="amount positive">KSh ${data.rentalIncome.toLocaleString()}</div>
              <p>Collected from ${data.occupiedUnits} occupied units</p>
            </div>
            <div class="card">
              <h3>Occupancy Status</h3>
              <p>Total Units: ${data.totalUnits}</p>
              <p>Occupied: ${data.occupiedUnits}</p>
              <p>Vacant: ${data.vacantUnits}</p>
              <p>Occupancy Rate: ${data.occupancyRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Expenses Breakdown</h2>
          <table>
            <tr><th>Category</th><th>Amount (KSh)</th></tr>
            <tr><td>Maintenance & Repairs</td><td>${data.expenses.maintenance.toLocaleString()}</td></tr>
            <tr><td>Utilities</td><td>${data.expenses.utilities.toLocaleString()}</td></tr>
            <tr><td>Staff Salaries</td><td>${data.expenses.salaries.toLocaleString()}</td></tr>
            <tr><td>Other Expenses</td><td>${data.expenses.other.toLocaleString()}</td></tr>
            <tr><th>Total Expenses</th><th>${data.expenses.total.toLocaleString()}</th></tr>
          </table>
        </div>

        <div class="section">
          <h2>Repairs & Maintenance Summary</h2>
          <div class="card">
            <p><strong>Completed:</strong> ${data.repairsSummary.completed}</p>
            <p><strong>Ongoing:</strong> ${data.repairsSummary.ongoing}</p>
            <p><strong>Upcoming:</strong> ${data.repairsSummary.upcoming}</p>
            <p><strong>Details:</strong> ${data.repairsSummary.details.join(", ")}</p>
          </div>
        </div>

        <div class="section">
          <h2>Marketing Updates</h2>
          <div class="card">
            <p><strong>New Vacancies:</strong> ${data.marketingUpdates.newVacancies}</p>
            <p><strong>Inquiries Received:</strong> ${data.marketingUpdates.inquiries}</p>
            <p><strong>Property Viewings:</strong> ${data.marketingUpdates.viewings || "No data"}</p>
          </div>
        </div>

        <div class="section">
          <h2>Net Income Summary</h2>
          <div class="card">
            <h3>Net Income After Deductions</h3>
            <div class="amount ${data.netIncome >= 0 ? "positive" : "negative"}">
              KSh ${data.netIncome.toLocaleString()}
            </div>
            <p>Rental Income: KSh ${data.rentalIncome.toLocaleString()}</p>
            <p>Less Expenses: KSh ${data.expenses.total.toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading revenue data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Revenue Reports
          </h1>
          <p className="text-muted-foreground mt-2">Generate and send monthly revenue reports to landlords</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
            {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
            <CardDescription>Monthly revenue, expenses, and net income overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`KSh ${value.toLocaleString()}`, ""]} />
                  <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="netIncome" stroke="#2563eb" strokeWidth={2} name="Net Income" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Report Generation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </CardTitle>
              <CardDescription>Create monthly reports for landlords</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="month">Select Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date()
                      date.setMonth(date.getMonth() - i)
                      const value = date.toISOString().slice(0, 7)
                      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="landlord">Select Landlord</Label>
                <Select value={selectedLandlord} onValueChange={setSelectedLandlord}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a landlord" />
                  </SelectTrigger>
                  <SelectContent>
                    {landlords.map((landlord) => (
                      <SelectItem key={landlord.id} value={landlord.id}>
                        {landlord.name} ({landlord.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={downloadReport} variant="outline" className="flex-1 bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={sendReport} disabled={sending || !selectedLandlord} className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  {sending ? "Sending..." : "Send Report"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Preview */}
          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  {new Date(reportData.period).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-1" />
                    <p className="text-sm text-muted-foreground">Rental Income</p>
                    <p className="font-bold text-green-600">KSh {reportData.rentalIncome.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Building className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-sm text-muted-foreground">Occupancy</p>
                    <p className="font-bold text-blue-600">{reportData.occupancyRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto text-red-600 mb-1" />
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="font-bold text-red-600">KSh {reportData.expenses.total.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                    <p className="text-sm text-muted-foreground">Net Income</p>
                    <p className={`font-bold ${reportData.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      KSh {reportData.netIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Units:</span>
                    <span>{reportData.totalUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Occupied:</span>
                    <span>{reportData.occupiedUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vacant:</span>
                    <span>{reportData.vacantUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Inquiries:</span>
                    <span>{reportData.marketingUpdates.inquiries}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
