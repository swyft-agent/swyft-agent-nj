"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Building, Phone, Mail, Calendar, DollarSign } from 'lucide-react'
import { AddTenantModal } from "@/components/add-tenant-modal"
import { TenantProfileModal } from "@/components/tenant-profile-modal"
import { EmptyState } from "@/components/empty-state"
import { fetchTenants, fetchBuildings } from "@/lib/supabase-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Tenant {
  id: string
  name: string
  email?: string
  phone?: string
  unit: string
  building_id: string
  move_in_date: string
  lease_end_date?: string
  status: string
  rent_status: string
  monthly_rent: number
  arrears: number
  house_size?: string
  buildings?: {
    name: string
    address: string
    building_income: number
  }
}

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [buildings, setBuildings] = useState<any[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all")

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const [tenantsData, buildingsData] = await Promise.all([
        fetchTenants(),
        fetchBuildings()
      ])
      setTenants(Array.isArray(tenantsData) ? tenantsData : [])
      setBuildings(Array.isArray(buildingsData) ? buildingsData : [])
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data")
      setTenants([])
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }

  const handleTenantAdded = () => {
    loadTenants()
    setShowAddModal(false)
  }

  const getRentStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-green-100 text-green-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "moving_out":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredTenants = selectedBuilding === "all"
    ? tenants
    : tenants.filter(tenant => tenant.building_id === selectedBuilding)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tenants</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tenants</h1>
          <Button onClick={() => {
            console.log("Add Tenant button clicked");
            setShowAddModal(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={loadTenants} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
        <AddTenantModal
          isOpen={showAddModal}
          onClose={() => {
            console.log("Closing modal");
            setShowAddModal(false);
          }}
          onTenantAdded={handleTenantAdded}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">
            Manage your tenants and track their information
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => {
            console.log("Add Tenant button clicked");
            setShowAddModal(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <EmptyState
          icon={User}
          title={tenants.length === 0 ? "No tenants yet" : "No tenants in selected building"}
          description={tenants.length === 0 ? "Start by adding your first tenant to track their information and rent payments." : "No tenants found for the selected building filter."}
          action={
            <Button onClick={() => {
              console.log("Add Tenant button clicked");
              setShowAddModal(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              {tenants.length === 0 ? "Add Your First Tenant" : "Add Tenant"}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTenant(tenant)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Unit {tenant.unit}
                      {tenant.buildings?.name && ` - ${tenant.buildings.name}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                    <Badge className={getRentStatusColor(tenant.rent_status)}>
                      {tenant.rent_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {tenant.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{tenant.email}</span>
                    </div>
                  )}
                  {tenant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>KES {tenant.monthly_rent?.toLocaleString() || 0}/month</span>
                  </div>
                  {tenant.arrears > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <DollarSign className="h-3 w-3" />
                      <span>Arrears: KES {tenant.arrears.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>
                      Moved in: {new Date(tenant.move_in_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddTenantModal
        isOpen={showAddModal}
        onClose={() => {
          console.log("Closing modal");
          setShowAddModal(false);
        }}
        onTenantAdded={handleTenantAdded}
      />

      {selectedTenant && (
        <TenantProfileModal
          tenant={selectedTenant}
          isOpen={!!selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onTenantUpdated={loadTenants}
        />
      )}
    </div>
  )
}
