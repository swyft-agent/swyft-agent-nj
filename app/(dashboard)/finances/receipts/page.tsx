"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Building2, Receipt } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

type BuildingRow = {
  building_id: string
  name: string
  company_account_id?: string
}

type ReceiptRow = {
  id: string
  tenant_id?: string | null
  amount?: number | string | null
  method?: string | null
  status?: string | null
  created_at?: string | null
  building_id?: string | null
  description?: string | null
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

export default function ReceiptsPage() {
  const [buildings, setBuildings] = useState<BuildingRow[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>("")

  const [receipts, setReceipts] = useState<ReceiptRow[]>([])
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        console.error("Receipts buildings error:", e)
      } finally {
        setLoadingBuildings(false)
      }
    }
    loadBuildings()
  }, [])

  useEffect(() => {
    const loadReceipts = async () => {
      if (!selectedBuilding) {
        setReceipts([])
        return
      }
      try {
        setLoadingReceipts(true)
        setError(null)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError("Unable to load data. Please sign in again.")
          setReceipts([])
          return
        }
        const companyId = await resolveCompanyId(user)
        if (!companyId) {
          setError("Unable to load receipts for your company.")
          setReceipts([])
          return
        }

        // Try payments table first; if not present or error, fall back gracefully
        const { data, error } = await supabase
          .from("payments")
          .select("id,tenant_id,amount,method,status,created_at,building_id,description")
          .eq("company_account_id", companyId)
          .eq("building_id", selectedBuilding)
          .order("created_at", { ascending: false })
        if (error) throw error
        setReceipts(Array.isArray(data) ? (data as ReceiptRow[]) : [])
      } catch (e: any) {
        console.warn("Receipts payments query failed; falling back to empty state:", e?.message || e)
        setReceipts([])
      } finally {
        setLoadingReceipts(false)
      }
    }
    loadReceipts()
  }, [selectedBuilding])

  const selectedBuildingName = useMemo(() => {
    const b = buildings.find((x) => String(x.building_id) === String(selectedBuilding))
    return b?.name ?? ""
  }, [buildings, selectedBuilding])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Receipts</h1>
          <p className="text-muted-foreground">Recent payments and receipts</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-none shadow-sm md:col-span-3">
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
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Unable to load data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            Receipts {selectedBuildingName ? `— ${selectedBuildingName}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedBuilding ? (
            <p className="text-sm text-muted-foreground">Select a building to view receipts.</p>
          ) : loadingReceipts ? (
            <p className="text-sm text-muted-foreground">Loading receipts…</p>
          ) : receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No receipts found</p>
          ) : (
            receipts.map((r) => {
              const amount =
                typeof r.amount === "string"
                  ? Number.parseFloat(r.amount || "0")
                  : typeof r.amount === "number"
                    ? r.amount
                    : 0
              return (
                <div key={r.id} className="flex items-center justify-between rounded-md border bg-card p-3">
                  <div className="space-y-0.5">
                    <div className="font-medium">{r.description || "Payment"}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(r.created_at || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status && <Badge variant="secondary">{r.status}</Badge>}
                    <Badge>{formatKES(isNaN(amount) ? 0 : amount)}</Badge>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
