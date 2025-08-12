"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Search, Trash2, CheckCircle, XCircle, MessageSquare, Calendar, DollarSign } from "lucide-react"
import { fetchInquiries } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"
import type { Inquiry } from "@/lib/types"

function InquiriesPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="bg-gray-200 h-10 w-64 rounded-md animate-pulse" />
        <div className="bg-gray-200 h-10 w-32 rounded-md animate-pulse" />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Property</TableHead>
              <TableHead>Inquirer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="bg-gray-200 h-5 w-40 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="bg-gray-200 h-5 w-32 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="bg-gray-200 h-5 w-24 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="bg-gray-200 h-5 w-20 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="bg-gray-200 h-5 w-16 rounded-full animate-pulse" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="bg-gray-200 h-8 w-8 rounded-md animate-pulse ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState("")

  const getInquiries = async () => {
    try {
      setLoading(true)
      const data = await fetchInquiries()
      setInquiries(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error fetching inquiries",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getInquiries()
  }, [])

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const propertyName = inquiry.vacant_units?.property_name || ""
      const inquirerName = inquiry.name || ""
      const inquirerEmail = inquiry.email || ""
      const inquirerPhone = inquiry.phone_number || ""

      return (
        propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquirerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquirerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquirerPhone.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [inquiries, searchTerm])

  const updateInquiryStatus = async (id: string, status: "pending" | "contacted" | "closed") => {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id)

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Status updated successfully",
      })
      getInquiries()
    }
  }

  const deleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return

    const { error } = await supabase.from("inquiries").delete().eq("id", id)

    if (error) {
      toast({
        title: "Error deleting inquiry",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Inquiry deleted successfully",
      })
      getInquiries()
    }
  }

  const scheduleViewing = async (inquiry: Inquiry) => {
    // This would integrate with a calendar system
    toast({
      title: "Viewing scheduled",
      description: `Viewing scheduled for ${inquiry.name} at ${inquiry.vacant_units?.property_name}`,
    })
    updateInquiryStatus(inquiry.id, "contacted")
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedInquiry) return

    // This would integrate with a real chat system
    toast({
      title: "Message sent",
      description: `Message sent to ${selectedInquiry.name}`,
    })
    setChatMessage("")
    setChatOpen(false)
    updateInquiryStatus(selectedInquiry.id, "contacted")
  }

  const requestPayment = async (inquiry: Inquiry) => {
    // This would integrate with the wallet system
    toast({
      title: "Payment request sent",
      description: `Payment request sent to ${inquiry.name} for ${inquiry.vacant_units?.property_name}`,
    })
  }

  if (loading) {
    return <InquiriesPageSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Inquiries</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={getInquiries}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search inquiries..."
              className="pl-8 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredInquiries.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12 text-gray-400" />}
          title={searchTerm ? "No matching inquiries" : "No inquiries yet"}
          description={
            searchTerm ? "Try a different search term." : "New inquiries from potential tenants will appear here."
          }
        />
      ) : (
        <div className="grid gap-4 md:hidden">
          {/* Mobile Card View */}
          {filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{inquiry.vacant_units?.property_name || "N/A"}</CardTitle>
                    <CardDescription>Unit {inquiry.vacant_units?.unit_number || "N/A"}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      inquiry.status === "pending"
                        ? "default"
                        : inquiry.status === "contacted"
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      inquiry.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : inquiry.status === "contacted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }
                  >
                    {inquiry.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{inquiry.name}</p>
                  <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                  <p className="text-sm text-muted-foreground">{inquiry.phone_number}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedInquiry(inquiry)
                      setChatOpen(true)
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => scheduleViewing(inquiry)}>
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => requestPayment(inquiry)}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Property</TableHead>
              <TableHead>Inquirer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInquiries.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell>
                  <div className="font-medium">{inquiry.vacant_units?.property_name || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">Unit {inquiry.vacant_units?.unit_number || "N/A"}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{inquiry.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{inquiry.email}</div>
                  <div className="text-sm text-muted-foreground">{inquiry.phone_number}</div>
                </TableCell>
                <TableCell>{new Date(inquiry.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      inquiry.status === "pending"
                        ? "default"
                        : inquiry.status === "contacted"
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      inquiry.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : inquiry.status === "contacted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }
                  >
                    {inquiry.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedInquiry(inquiry)
                          setChatOpen(true)
                        }}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Start Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => scheduleViewing(inquiry)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Viewing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => requestPayment(inquiry)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Request Payment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateInquiryStatus(inquiry.id, "contacted")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Contacted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateInquiryStatus(inquiry.id, "closed")}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Mark as Closed
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteInquiry(inquiry.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat with {selectedInquiry?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <strong>Property:</strong> {selectedInquiry?.vacant_units?.property_name}
              </p>
              <p className="text-sm">
                <strong>Unit:</strong> {selectedInquiry?.vacant_units?.unit_number}
              </p>
              <p className="text-sm">
                <strong>Contact:</strong> {selectedInquiry?.email} • {selectedInquiry?.phone_number}
              </p>
            </div>
            <Textarea
              placeholder="Type your message here..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setChatOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendChatMessage} disabled={!chatMessage.trim()}>
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
