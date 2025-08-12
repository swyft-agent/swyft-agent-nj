"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { User, Phone, Mail, MapPin, Calendar, CreditCard, FileText, Download, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface TenantProfileModalProps {
  tenant: any
  isOpen: boolean
  onClose: () => void
}

export function TenantProfileModal({ tenant, isOpen, onClose }: TenantProfileModalProps) {
  const [paymentHistory, setPaymentHistory] = useState([])
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [buildingInfo, setBuildingInfo] = useState<any>(null)

  // Mock payment history data
  useEffect(() => {
    if (tenant) {
      const mockPayments = [
        {
          id: 1,
          month: "December 2024",
          amount: 25000,
          dueDate: "2024-12-01",
          paidDate: "2024-12-03",
          status: "paid",
          method: "M-Pesa",
          reference: "QK12345678",
        },
        {
          id: 2,
          month: "November 2024",
          amount: 25000,
          dueDate: "2024-11-01",
          paidDate: "2024-11-01",
          status: "paid",
          method: "Bank Transfer",
          reference: "BT98765432",
        },
        {
          id: 3,
          month: "October 2024",
          amount: 25000,
          dueDate: "2024-10-01",
          paidDate: null,
          status: "late",
          method: null,
          reference: null,
        },
      ]
      setPaymentHistory(mockPayments)

      const mockNotes = [
        {
          id: 1,
          date: "2024-12-15",
          author: "John Admin",
          type: "payment",
          content: "Payment received via M-Pesa. Receipt confirmed.",
        },
        {
          id: 2,
          date: "2024-12-10",
          author: "Sarah Manager",
          type: "maintenance",
          content: "Tenant reported leaking faucet. Maintenance scheduled for tomorrow.",
        },
      ]
      setNotes(mockNotes)
    }
  }, [tenant])

  // Fetch building information
  useEffect(() => {
    const fetchBuildingInfo = async () => {
      if (tenant?.building_id) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: building } = await supabase
          .from('buildings')
          .select('name, address')
          .eq('id', tenant.building_id)
          .single()
        
        setBuildingInfo(building)
      }
    }
    
    fetchBuildingInfo()
  }, [tenant?.building_id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case "late":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Late
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CreditCard className="h-4 w-4 text-green-600" />
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "communication":
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return

    const note = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      author: "Current User",
      type: "communication",
      content: newNote,
    }

    setNotes((prev) => [note, ...prev])
    setNewNote("")
  }

  const handleDownloadStatement = () => {
    // Mock download functionality
    alert("Statement download would be implemented here")
  }

  if (!tenant) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {tenant.name} - Unit {tenant.unit}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="lease">Lease Info</TabsTrigger>
            <TabsTrigger value="notes">Notes & Communications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {buildingInfo ? `${buildingInfo.name} - ${buildingInfo.address}` : tenant.building} - Unit {tenant.unit}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Rent Status:</span>
                    {getStatusBadge(tenant.rentStatus)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>House Size:</span>
                    <Badge variant="outline">{tenant.houseSize}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Move-in: {new Date(tenant.moveInDate).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Tenant
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadStatement}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Statement
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <div className="flex gap-2">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleDownloadStatement}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.month}</TableCell>
                        <TableCell>KES {payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>{payment.method || "—"}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="font-mono text-sm">{payment.reference || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lease" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lease Agreement Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Lease Start Date</Label>
                    <p className="text-sm">{new Date(tenant.moveInDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Lease End Date</Label>
                    <p className="text-sm">
                      {tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Monthly Rent</Label>
                    <p className="text-sm font-semibold">KES 25,000</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Security Deposit</Label>
                    <p className="text-sm">KES 50,000</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Lease Duration</Label>
                    <p className="text-sm">12 months</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Renewal Status</Label>
                    <Badge variant="outline">Auto-renewable</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Arrears Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>October 2024</span>
                    <span className="text-red-600 font-semibold">KES 25,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late Fees</span>
                    <span className="text-red-600 font-semibold">KES 2,500</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total Arrears</span>
                    <span className="text-red-600">KES 27,500</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add a note about this tenant..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  Add Note
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notes.map((note: any) => (
                    <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(note.type)}
                        <span className="font-medium text-sm">{note.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
