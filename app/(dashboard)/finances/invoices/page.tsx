"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Building2, FileText, Mail, Send, Users } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type BuildingRow = {
  building_id: string
  name: string
  company_account_id?: string
}

type TenantRow = {
  id: string
  name: string
  email: string | null
  phone?: string | null
  building_id: string | null
  unit_id: string | null
  unit?: string | null // textual unit label if stored on tenants table
}

type UnitRow = {
  unit_id: string
  unit_number: string | null
  rent_amount?: string | number | null
}

type GeneratedInvoice = {
  id: string
  tenantId: string
  tenantName: string
  tenantEmail: string | null
  buildingId: string
  buildingName: string
  unitLabel: string
  amountKES: number
  createdAt: string
}

function formatKES(n: number) {
  return `KES ${Math.round(n).toLocaleString()}`
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
  } catch {
    return null
  }
}

export default function InvoicesPage() {
  const { toast } = useToast()

  const [buildings, setBuildings] = useState<BuildingRow[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>("")

  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [tenantSearch, setTenantSearch] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")

  const [unitsById, setUnitsById] = useState<Record<string, UnitRow>>({})

  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedInvoices, setGeneratedInvoices] = useState<GeneratedInvoice[]>([])
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(tenantSearch.trim()), 300)
    return () => clearTimeout(t)
  }, [tenantSearch])

  // Load buildings scoped to company_account_id
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoadingBuildings(true)
        setError(null)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError("Unable to load data. Please sign in again.")
          setBuildings([])
          return
        }
        const companyId = await resolveCompanyId(user)
        if (!companyId) {
          setError("Unable to load buildings for your company.")
          setBuildings([])
          return
        }
        const { data, error } = await supabase
          .from("buildings")
          .select("building_id,name,company_account_id")
          .eq("company_account_id", companyId)
          .order("name", { ascending: true })
        if (error) throw error
        setBuildings(Array.isArray(data) ? (data as BuildingRow[]) : [])
      } catch (e: any) {
        setError("Unable to load buildings")
        console.error("Invoices buildings error:", e)
      } finally {
        setLoadingBuildings(false)
      }
    }
    loadBuildings()
  }, [])

  // Load tenants for selected building (scoped to company) + related units in a second query
  useEffect(() => {
    const loadTenantsAndUnits = async () => {
      if (!selectedBuilding) {
        setTenants([])
        setUnitsById({})
        return
      }
      try {
        setLoadingTenants(true)
        setError(null)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError("Unable to load data. Please sign in again.")
          setTenants([])
          setUnitsById({})
          return
        }
        const companyId = await resolveCompanyId(user)
        if (!companyId) {
          setError("Unable to load tenants for your company.")
          setTenants([])
          setUnitsById({})
          return
        }

        // Base tenants query
        let tenantQuery = supabase
          .from("tenants")
          .select("id,name,email,phone,building_id,unit_id,unit")
          .eq("company_account_id", companyId)
          .eq("building_id", selectedBuilding)

        if (searchDebounced) {
          tenantQuery = tenantQuery.or(
            `name.ilike.%${searchDebounced}%,email.ilike.%${searchDebounced}%,phone.ilike.%${searchDebounced}%`,
          )
        }

        const { data: tenantData, error: tenantErr } = await tenantQuery.order("name", { ascending: true })
        if (tenantErr) throw tenantErr

        const tenantsList = Array.isArray(tenantData) ? (tenantData as TenantRow[]) : []
        setTenants(tenantsList)

        // Load related units in one separate query (if we have unit_ids)
        const unitIds = Array.from(new Set(tenantsList.map((t) => t.unit_id).filter(Boolean))) as string[]
        if (unitIds.length > 0) {
          const { data: unitsData, error: unitsErr } = await supabase
            .from("units")
            .select("unit_id,unit_number,rent_amount")
            .in("unit_id", unitIds)
          if (unitsErr) throw unitsErr
          const map: Record<string, UnitRow> = {}
          ;(unitsData as UnitRow[]).forEach((u) => {
            if (u.unit_id) map[String(u.unit_id)] = u
          })
          setUnitsById(map)
        } else {
          setUnitsById({})
        }
      } catch (e: any) {
        setError("Unable to load tenants")
        console.error("Invoices tenants error:", e)
      } finally {
        setLoadingTenants(false)
      }
    }
    loadTenantsAndUnits()
  }, [selectedBuilding, searchDebounced])

  const selectedBuildingName = useMemo(() => {
    const b = buildings.find((x) => String(x.building_id) === String(selectedBuilding))
    return b?.name ?? ""
  }, [buildings, selectedBuilding])

  const canGenerate = selectedBuilding && tenants.length > 0 && !isGenerating

  const handleGenerateInvoices = async () => {
    if (!canGenerate) return
    setIsGenerating(true)
    setGeneratedInvoices([])
    try {
      // Simulate generation time; in real app this would be a server action/route
      await new Promise((r) => setTimeout(r, 1200))
      const invoices: GeneratedInvoice[] = tenants.map((t) => {
        const unitRow = t.unit_id ? unitsById[String(t.unit_id)] : undefined
        const unitLabel = t.unit ?? unitRow?.unit_number ?? "N/A"
        const raw = unitRow?.rent_amount
        const amount = typeof raw === "string" ? Number.parseFloat(raw || "0") : typeof raw === "number" ? raw : 0
        return {
          id: `inv_${Date.now()}_${t.id}`,
          tenantId: t.id,
          tenantName: t.name,
          tenantEmail: t.email ?? null,
          buildingId: selectedBuilding,
          buildingName: selectedBuildingName || "Building",
          unitLabel: unitLabel || "N/A",
          amountKES: isNaN(amount) ? 0 : amount,
          createdAt: new Date().toISOString(),
        }
      })
      setGeneratedInvoices(invoices)
      toast({ title: "Invoices generated", description: `Created ${invoices.length} invoice(s).` })
    } catch (e) {
      console.error("Generate invoices error:", e)
      toast({ title: "Failed to generate invoices", description: "Please try again.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenSendDialog = () => {
    if (generatedInvoices.length === 0) {
      toast({ title: "No invoices to send", description: "Generate invoices first." })
      return
    }
    setSendDialogOpen(true)
  }

  const handleSend = async () => {
    // Placeholder send logic
    await new Promise((r) => setTimeout(r, 800))
    setSendDialogOpen(false)
    toast({
      title: "Send to Tenants",
      description:
        "Invoices will be sent to each tenant's email when email integration is enabled. (Placeholder complete)",
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Generate and send invoices to tenants</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-none shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Select Building
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding} disabled={loadingBuildings}>
              <SelectTrigger className="w-full md:w-[320px]">
                <SelectValue placeholder={loadingBuildings ? "Loading buildings..." : "Choose a building"} />
              </SelectTrigger>
              <SelectContent>
                {buildings.length === 0 ? (
                  <SelectItem value="no-buildings" disabled>
                    No buildings found
                  </SelectItem>
                ) : (
                  buildings.map((b) => (
                    <SelectItem key={b.building_id} value={String(b.building_id)}>
                      {b.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="hidden md:block text-sm text-muted-foreground">
              {selectedBuilding ? `Selected: ${selectedBuildingName}` : "No building selected"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Search Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, email, or phone"
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              disabled={!selectedBuilding || loadingTenants}
            />
          </CardContent>
        </Card>
      </div>

      {/* Error handling */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Unable to load data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tenants list */}
      <Card className="border-none shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Tenants in {selectedBuildingName || "…"}</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleGenerateInvoices} disabled={!canGenerate}>
              <FileText className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating…" : "Generate Invoices for All Tenants"}
            </Button>
            <Button variant="outline" onClick={handleOpenSendDialog} disabled={generatedInvoices.length === 0}>
              <Send className="mr-2 h-4 w-4" />
              Send to Tenants
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedBuilding ? (
            <p className="text-sm text-muted-foreground">Select a building to view tenants.</p>
          ) : loadingTenants ? (
            <p className="text-sm text-muted-foreground">Loading tenants…</p>
          ) : tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants found</p>
          ) : (
            tenants.map((t) => {
              const u = t.unit_id ? unitsById[String(t.unit_id)] : undefined
              const unitLabel = t.unit ?? u?.unit_number ?? "N/A"
              const amountRaw = u?.rent_amount
              const amount =
                typeof amountRaw === "string"
                  ? Number.parseFloat(amountRaw || "0")
                  : typeof amountRaw === "number"
                    ? amountRaw
                    : 0
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md border bg-card p-3"
                  role="listitem"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t.email || "No email"} • Unit {unitLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{formatKES(isNaN(amount) ? 0 : amount)}</Badge>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Generated invoices summary */}
      {generatedInvoices.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Generated Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {generatedInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-md border bg-card p-3">
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {inv.tenantName} —{" "}
                    <span className="font-normal text-muted-foreground">{inv.tenantEmail || "No email"}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {inv.buildingName} • Unit {inv.unitLabel}
                  </div>
                </div>
                <Badge>{formatKES(inv.amountKES)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Send dialog placeholder */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoices to Tenants</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              You are about to send {generatedInvoices.length} invoice(s) to tenants for {selectedBuildingName}. Email
              delivery will be enabled later. This is a placeholder action.
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium mb-1">Recipients Preview</div>
              <div className="max-h-40 overflow-auto space-y-1">
                {generatedInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {inv.tenantName} — {inv.tenantEmail || "No email"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Email subject (placeholder)</Label>
              <Input id="subject" placeholder="Your monthly rent invoice is ready" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
