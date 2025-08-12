"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Building, Calendar, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

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

interface AddNoticeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddNotice: (notice: any) => void
}

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
  unit?: string | null // unit number stored as text on tenants table
}

export function AddNoticeModal({ open, onOpenChange, onAddNotice }: AddNoticeModalProps) {
  const [formData, setFormData] = useState({
    tenant: "",
    unit: "",
    property: "",
    type: "",
    date: "",
    description: "",
  })

  const [buildings, setBuildings] = useState<BuildingRow[]>([])
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [loadingTenants, setLoadingTenants] = useState(false)

  const [tenantSearch, setTenantSearch] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")
  const [selectedBuilding, setSelectedBuilding] = useState("") // must be a real building_id

  // Debounce tenant search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(tenantSearch.trim()), 300)
    return () => clearTimeout(t)
  }, [tenantSearch])

  // Fetch buildings for the logged-in user's company (using building_id PK and scoping by company_account_id)
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoadingBuildings(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const companyId = await resolveCompanyId(user)
        if (!companyId) {
          console.warn("No company_account_id resolved for user")
          setBuildings([])
          return
        }

        const { data, error } = await supabase
          .from("buildings")
          .select("building_id,name,company_account_id")
          .eq("company_account_id", companyId)
          .order("name", { ascending: true })

        if (error) throw error
        setBuildings((data as BuildingRow[]) || [])
      } catch (err) {
        console.error("Error fetching buildings:", err)
      } finally {
        setLoadingBuildings(false)
      }
    }

    if (open) {
      fetchBuildings()
    }
  }, [open])

  // Fetch tenants filtered by selected building and search (name/email/phone)
  useEffect(() => {
    const fetchTenants = async () => {
      if (!selectedBuilding) {
        setTenants([])
        return
      }
      try {
        setLoadingTenants(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const companyId = await resolveCompanyId(user)
        if (!companyId) {
          console.warn("No company_account_id resolved for user (tenants fetch)")
          setTenants([])
          return
        }

        // Base query: only this company and this building
        let query = supabase
          .from("tenants")
          .select("id,name,email,phone,building_id,unit_id,unit")
          .eq("company_account_id", companyId)
          .eq("building_id", selectedBuilding)

        // Apply search across name OR email OR phone
        if (searchDebounced) {
          query = query.or(
            `name.ilike.%${searchDebounced}%,email.ilike.%${searchDebounced}%,phone.ilike.%${searchDebounced}%`,
          )
        }

        const { data, error } = await query.order("name", { ascending: true })
        if (error) throw error
        setTenants((data as TenantRow[]) || [])
      } catch (err) {
        console.error("Error fetching tenants:", err)
      } finally {
        setLoadingTenants(false)
      }
    }

    if (open) {
      fetchTenants()
    }
  }, [open, selectedBuilding, searchDebounced])

  const buildingOptions = useMemo(() => buildings, [buildings])

  const getBuildingName = (bId: string | null) => {
    if (!bId) return ""
    const b = buildings.find((x) => String(x.building_id) === String(bId))
    return b?.name ?? ""
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTenantSelect = (tenantId: string) => {
    const selectedTenant = tenants.find((t) => String(t.id) === String(tenantId))
    if (selectedTenant) {
      setFormData((prev) => ({
        ...prev,
        tenant: tenantId,
        property: getBuildingName(selectedTenant.building_id),
        unit: selectedTenant.unit ?? "",
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: authData } = await supabase.auth.getUser()
    const authUser = authData?.user
    if (!authUser) {
      console.error("Error creating notice: No authenticated user.")
      return
    }

    const companyId = await resolveCompanyId(authUser)
    if (!companyId) {
      console.error("Error creating notice: Missing company account context.")
      return
    }

    const selectedTenant = tenants.find((t) => String(t.id) === String(formData.tenant))

    const newNotice = {
      tenant_id: selectedTenant?.id ?? null,
      tenant_name: selectedTenant?.name ?? "",
      tenant_email: selectedTenant?.email ?? null,
      property: formData.property,
      unit: formData.unit,
      type: formData.type,
      date: formData.date,
      description: formData.description,

      // Provide full context so the caller doesn't need to re-resolve it
      company_account_id: companyId,
      user_id: authUser.id,
      created_by: authUser.id,

      // Optional helpers
      status: "pending",
      building_id: selectedTenant?.building_id ?? (selectedBuilding || null),
      unit_id: selectedTenant?.unit_id ?? null,
    }

    onAddNotice(newNotice)
    onOpenChange(false)

    setFormData({
      tenant: "",
      unit: "",
      property: "",
      type: "",
      date: "",
      description: "",
    })
    setTenantSearch("")
    setSelectedBuilding("")
    setTenants([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Notice</DialogTitle>
          <DialogDescription>Create a move-in or move-out notice for a tenant.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Building filter - only company-scoped buildings */}
          <div className="space-y-2">
            <Label htmlFor="building-filter">Filter by Building</Label>
            <Select
              value={selectedBuilding}
              onValueChange={(value) => {
                setSelectedBuilding(value)
                // Clear tenant selection and auto-filled fields when switching buildings
                setFormData((prev) => ({ ...prev, tenant: "", property: "", unit: "" }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {loadingBuildings ? (
                  <SelectItem value="loading-buildings" disabled>
                    Loading buildings...
                  </SelectItem>
                ) : buildingOptions.length === 0 ? (
                  <SelectItem value="no-buildings" disabled>
                    No buildings found
                  </SelectItem>
                ) : (
                  buildingOptions.map((b) => (
                    <SelectItem key={b.building_id} value={String(b.building_id)}>
                      {b.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Tenant search input (server-side filtered by building) */}
          <div className="space-y-2">
            <Label htmlFor="tenant-search">Search Tenant</Label>
            <Input
              id="tenant-search"
              placeholder="Type tenant name, email, or phone..."
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              disabled={!selectedBuilding}
            />
          </div>

          {/* Tenant selector - populated from DB filtered by selected building and search */}
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant *</Label>
            <Select
              value={formData.tenant}
              onValueChange={(value) => {
                handleInputChange("tenant", value)
                handleTenantSelect(value)
              }}
              disabled={!selectedBuilding}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedBuilding ? "Select tenant" : "Select a building first"} />
              </SelectTrigger>
              <SelectContent>
                {!selectedBuilding ? (
                  <SelectItem value="select-building-first" disabled>
                    Select a building first
                  </SelectItem>
                ) : loadingTenants ? (
                  <SelectItem value="loading-tenants" disabled>
                    Loading tenants...
                  </SelectItem>
                ) : tenants.length === 0 ? (
                  <SelectItem value="no-tenants" disabled>
                    {searchDebounced ? "No matching tenants" : "No tenants found"}
                  </SelectItem>
                ) : (
                  tenants.map((t) => {
                    const bits: string[] = []
                    if (t.email) bits.push(t.email)
                    if (t.unit) bits.push(`Unit ${t.unit}`)
                    const meta = bits.length ? ` — ${bits.join(" • ")}` : ""
                    return (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                        {meta}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-populated fields after tenant select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <div className="relative">
                <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="property"
                  placeholder="Property will be auto-filled"
                  className="pl-8"
                  value={formData.property}
                  readOnly
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit Number *</Label>
              <div className="relative">
                <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="unit"
                  placeholder="302"
                  className="pl-8"
                  value={formData.unit}
                  onChange={(e) => handleInputChange("unit", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Type + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Notice Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="move-in">Move-in Notice</SelectItem>
                  <SelectItem value="move-out">Move-out Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Notice Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  className="pl-8"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                placeholder="Additional details about the notice..."
                className="pl-8 min-h-[80px]"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Notice</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
