"use client"

import { useEffect, useMemo, useState } from "react"
import { MoreHorizontal, Search, PlusCircle, Trash2, Edit, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import EmptyState from "@/components/empty-state"
import { AddNoticeModal } from "@/components/add-notice-modal"

import { supabase } from "@/lib/supabase"
import { fetchNotices } from "@/lib/supabase-data"
// If your toast utils are in hooks, switch path to "@/hooks/use-toast"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

type Notice = {
  id: string
  tenants?: { name?: string; phone_number?: string | null; email?: string | null } | null
  buildings?: { name?: string } | null
  units?: { unit_number?: string | null } | null
  notice_type?: string | null
  date_issued?: string | null
  status?: string | null
}

async function resolveCompanyId(user: { id: string; user_metadata?: Record<string, any> }) {
  try {
    const metaCompanyId =
      user?.user_metadata?.company_account_id || user?.user_metadata?.companyId || user?.user_metadata?.company_id
    if (metaCompanyId) return String(metaCompanyId)

    const byId = await supabase.from("users").select("company_account_id").eq("id", user.id).limit(1).single()
    if (byId.data?.company_account_id) return String(byId.data.company_account_id)

    const byAuth = await supabase
      .from("users")
      .select("company_account_id")
      .eq("auth_user_id", user.id)
      .limit(1)
      .single()
    if (byAuth.data?.company_account_id) return String(byAuth.data.company_account_id)

    return null
  } catch (err) {
    console.error("resolveCompanyId error:", err)
    return null
  }
}

function NoticesPageSkeleton() {
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
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="bg-gray-200 h-5 w-32 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="bg-gray-200 h-5 w-40 rounded animate-pulse" />
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

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)

  async function getNotices() {
    try {
      setLoading(true)
      const data = await fetchNotices()
      setNotices(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error fetching notices",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getNotices()
  }, [])

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const tenantName = notice.tenants?.name || ""
      const buildingName = notice.buildings?.name || ""
      const unitNumber = notice.units?.unit_number || ""
      const noticeType = notice.notice_type || ""

      return (
        tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        noticeType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [notices, searchTerm])

  async function deleteNotice(id: string) {
    if (!confirm("Are you sure you want to delete this notice?")) return

    const { error } = await supabase.from("notices").delete().eq("id", id)
    if (error) {
      toast({
        title: "Error deleting notice",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({ title: "Notice deleted successfully" })
    getNotices()
  }

  function validateNoticePayload(input: {
    tenant_id: string | null
    tenant_name: string
    property: string
    unit: string
    type: string
    date: string
    description?: string | null
    unit_id?: string | null
    tenant_email?: string | null
  }) {
    const missing: string[] = []
    if (!input.tenant_name) missing.push("tenant_name")
    if (!input.property) missing.push("property")
    if (!input.unit) missing.push("unit")
    if (!input.type) missing.push("type")
    if (!input.date) missing.push("date")

    const allowedTypes = ["move-in", "move-out"]
    if (!allowedTypes.includes(input.type)) {
      throw new Error("type must be either 'move-in' or 'move-out'")
    }
    if (missing.length) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`)
    }
  }

  function handleSendToTenant(email: string | null | undefined, noticeId: string | undefined) {
    // Placeholder action for future integration
    console.log("Send to tenant placeholder:", { email, noticeId })
    toast({
      title: email ? `Preparing email to ${email}` : "Preparing email",
      description: "This action will send the notice to the tenant in a future update.",
    })
  }

  async function handleAddNotice(noticeData: any) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Prefer company ID from modal payload; fall back to resolver
      const companyIdFromPayload: string | undefined = noticeData.company_account_id
      const companyId = companyIdFromPayload || (await resolveCompanyId(user))
      if (!companyId) throw new Error("Missing company account context")

      // Validate required fields + constraints (unchanged)
      validateNoticePayload({
        tenant_id: noticeData.tenant_id ?? null,
        tenant_name: noticeData.tenant_name,
        property: noticeData.property,
        unit: noticeData.unit,
        type: noticeData.type,
        date: noticeData.date,
        description: noticeData.description ?? null,
        unit_id: noticeData.unit_id ?? null,
        tenant_email: noticeData.tenant_email ?? null,
      })

      const payload = {
        user_id: user.id,
        tenant_id: noticeData.tenant_id ?? null,
        tenant_name: noticeData.tenant_name,
        property: noticeData.property,
        unit: noticeData.unit,
        type: noticeData.type,
        date: noticeData.date,
        status: "pending",
        description: noticeData.description ?? null,
        company_account_id: companyId,
        unit_id: noticeData.unit_id ?? null,
        created_by: user.id,
      }

      const { data, error } = await supabase.from("notices").insert(payload).select("id").single()
      if (error) throw error

      toast({
        title: "Notice created successfully",
        description: "You can send it to the tenant now.",
        action: (
          <ToastAction altText="Send to Tenant" onClick={() => handleSendToTenant(noticeData.tenant_email, data?.id)}>
            Send to Tenant
          </ToastAction>
        ),
      })

      getNotices()
    } catch (error: any) {
      toast({
        title: "Error creating notice",
        description: error.message ?? "Unknown error",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <NoticesPageSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Notices</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={getNotices}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notices</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notices..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Notice
          </Button>
        </div>
      </div>

      {filteredNotices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12 text-gray-400" />}
          title={searchTerm ? "No matching notices" : "No notices found"}
          description={searchTerm ? "Try a different search term." : "Create a new notice to get started."}
          action={
            <Button onClick={() => setShowAddModal(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Notice
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell>
                    <div className="font-medium">{notice.tenants?.name || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">{notice.tenants?.phone_number || ""}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{notice.buildings?.name || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">Unit {notice.units?.unit_number || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{notice.notice_type}</Badge>
                  </TableCell>
                  <TableCell>{notice.date_issued ? new Date(notice.date_issued).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={notice.status === "delivered" ? "default" : "outline"}
                      className={
                        notice.status === "delivered" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {notice.status}
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
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteNotice(notice.id)}>
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
      )}
      <AddNoticeModal open={showAddModal} onOpenChange={setShowAddModal} onAddNotice={handleAddNotice} />
    </div>
  )
}
