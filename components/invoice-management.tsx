"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  FileText,
  Download,
  MoreHorizontal,
  Plus,
  Mail,
  MessageSquare,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { generateInvoiceNumber } from "@/lib/invoice-generator"

interface Invoice {
  id: string
  invoiceNumber: string
  tenantName: string
  unit: string
  building: string
  amount: number
  dueDate: string
  status: "pending" | "sent" | "paid" | "overdue"
  createdAt: string
  pdfUrl?: string
}

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])

  // Mock data
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: "1",
        invoiceNumber: "INV-202412-001",
        tenantName: "John Smith",
        unit: "302",
        building: "Skyline Apartments",
        amount: 25000,
        dueDate: "2024-12-31",
        status: "sent",
        createdAt: "2024-12-01",
        pdfUrl: "/invoices/inv-001.pdf",
      },
      {
        id: "2",
        invoiceNumber: "INV-202412-002",
        tenantName: "Sarah Johnson",
        unit: "105",
        building: "Parkview Heights",
        amount: 30000,
        dueDate: "2024-12-31",
        status: "pending",
        createdAt: "2024-12-01",
      },
      {
        id: "3",
        invoiceNumber: "INV-202411-003",
        tenantName: "Mike Wilson",
        unit: "201",
        building: "Riverside Condos",
        amount: 22000,
        dueDate: "2024-11-30",
        status: "paid",
        createdAt: "2024-11-01",
      },
    ]
    setInvoices(mockInvoices)
  }, [])

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.unit.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Mail className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleGenerateInvoice = async (tenantId: string) => {
    setLoading(true)
    try {
      // Mock invoice generation
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: generateInvoiceNumber(),
        tenantName: "New Tenant",
        unit: "101",
        building: "Sample Building",
        amount: 25000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "pending",
        createdAt: new Date().toISOString().split("T")[0],
      }

      setInvoices((prev) => [newInvoice, ...prev])
      alert("Invoice generated successfully!")
    } catch (error) {
      console.error("Error generating invoice:", error)
      alert("Failed to generate invoice")
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvoice = async (invoice: Invoice, method: "email" | "whatsapp") => {
    setLoading(true)
    try {
      // Mock sending logic
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? { ...inv, status: "sent" as const } : inv)))

      alert(`Invoice sent via ${method}!`)
    } catch (error) {
      console.error("Error sending invoice:", error)
      alert("Failed to send invoice")
    } finally {
      setLoading(false)
    }
  }

  const handleBulkGenerate = async () => {
    setLoading(true)
    try {
      // Mock bulk generation
      await new Promise((resolve) => setTimeout(resolve, 2000))
      alert("Bulk invoices generated successfully!")
      setIsGenerateModalOpen(false)
    } catch (error) {
      console.error("Error generating bulk invoices:", error)
      alert("Failed to generate bulk invoices")
    } finally {
      setLoading(false)
    }
  }

  const totalInvoices = invoices.length
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidInvoices = invoices.filter((inv) => inv.status === "paid").length
  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue").length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">Generate and manage tenant invoices</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Invoices
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Monthly Invoices</DialogTitle>
                <DialogDescription>Generate invoices for all tenants for the current month</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Billing Month</Label>
                  <Select defaultValue={new Date().getMonth().toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">January</SelectItem>
                      <SelectItem value="1">February</SelectItem>
                      <SelectItem value="2">March</SelectItem>
                      <SelectItem value="3">April</SelectItem>
                      <SelectItem value="4">May</SelectItem>
                      <SelectItem value="5">June</SelectItem>
                      <SelectItem value="6">July</SelectItem>
                      <SelectItem value="7">August</SelectItem>
                      <SelectItem value="8">September</SelectItem>
                      <SelectItem value="9">October</SelectItem>
                      <SelectItem value="10">November</SelectItem>
                      <SelectItem value="11">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkGenerate} disabled={loading}>
                    {loading ? "Generating..." : "Generate All"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="font-medium">{invoice.tenantName}</TableCell>
                  <TableCell>{invoice.unit}</TableCell>
                  <TableCell>{invoice.building}</TableCell>
                  <TableCell className="font-semibold">KES {invoice.amount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendInvoice(invoice, "email")}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send via Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendInvoice(invoice, "whatsapp")}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send via WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
