"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MapPin, BuildingIcon, Users, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { fetchBuildings, updateBuilding, deleteBuilding } from "@/lib/supabase-data"

interface Building {
  id: string
  name: string
  address: string
  city: string
  state: string
  building_type: string
  total_units: number
  description: string
  contact_info: string
  status: string
  created_at: string
}

export default function BuildingsPage() {
  const { user } = useAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadBuildings()
    }
  }, [user?.id])

  const loadBuildings = async () => {
    try {
      setLoading(true)
      const data = await fetchBuildings()
      setBuildings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading buildings:", error)
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (building: Building) => {
    // 🛑 CRITICAL FIX: Ensure the building object and its ID are valid
    if (!building || !building.id) {
        console.error("Attempted to call handleEdit with no building object or missing ID.")
        alert("Cannot save changes: Building ID is missing.")
        return
    }
    console.log("Handling edit for building ID:", building.id);

    try {
      // Create a clean updates object, excluding immutable fields like id and created_at
      const updates = {
        name: building.name,
        address: building.address,
        city: building.city,
        state: building.state,
        building_type: building.building_type,
        total_units: building.total_units,
        description: building.description,
        contact_info: building.contact_info,
        status: building.status,
      }
      
      const updatedBuilding = await updateBuilding(building.id, updates)

      if (updatedBuilding) {
        // Update local state with the returned data
        setBuildings(prev => prev.map(b => b.id === building.id ? updatedBuilding : b))
        setEditingBuilding(null)
        console.log("Building updated successfully");
      }
    } catch (error) {
      console.error("Error updating building:", error)
      alert("Failed to update building. Please try again.")
    }
  }

  const handleDelete = async (buildingId: string) => {
    if (!buildingId) return
    
    try {
      const success = await deleteBuilding(buildingId)
      if (success) {
        // Remove from local state
        setBuildings(prev => prev.filter(b => b.id !== buildingId))
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error("Error deleting building:", error)
      alert("Failed to delete building. Please try again.")
    }
  }

  const startEdit = (building: Building) => {
    console.log("Starting edit for building:", building);
    // Use a spread operator to create a deep copy for safe editing
    setEditingBuilding({...building})
  }

  const cancelEdit = () => {
    setEditingBuilding(null)
  }

  const updateEditingField = (field: keyof Building, value: string | number) => {
    if (editingBuilding) {
      // 🛡️ SECURITY/STABILITY FIX: Prevent setting or changing the ID
      if (field === 'id' || field === 'created_at') {
        console.warn(`Attempted to update immutable field: ${field}`);
        return;
      }
      
      // Ensure total_units is handled as a number
      const finalValue = field === 'total_units' 
        ? (typeof value === 'string' ? parseInt(value) || 0 : value) 
        : value;
        
      setEditingBuilding(prev => prev ? {...prev, [field]: finalValue as any} : null)
    }
  }

  const filteredBuildings = buildings.filter((building) => {
    const matchesSearch =
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || building.status === filterStatus
    const matchesType = filterType === "all" || building.building_type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="w-full space-y-4 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Buildings</h1>
          <Button asChild>
            <Link href="/new-building">
              <Plus className="mr-2 h-4 w-4" />
              Add Building
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buildings</h1>
          <p className="text-gray-600 mt-1">Manage your property buildings</p>
        </div>
        <Button asChild>
          <Link href="/new-building">
            <Plus className="mr-2 h-4 w-4" />
            Add Building
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, address, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="mixed">Mixed Use</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Buildings Grid */}
      {filteredBuildings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <BuildingIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No buildings found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all" || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first building"}
              </p>
              <Button asChild>
                <Link href="/new-building">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Building
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings.map((building) => (
            <Card key={building.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{building.name}</CardTitle>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="line-clamp-1">
                        {building.address}, {building.city}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={
                      building.status === "active"
                        ? "bg-green-100 text-green-800"
                        : building.status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {building.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <BuildingIcon className="h-4 w-4 mr-1" />
                    <span className="capitalize">{building.building_type}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{building.total_units} units</span>
                  </div>
                </div>

                {building.description && <p className="text-sm text-gray-600 line-clamp-2">{building.description}</p>}

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-xs text-gray-500">Added {new Date(building.created_at).toLocaleDateString()}</p>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      {/* Link to a dedicated view page for the building */}
                      <Link href={`/buildings/${building.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEdit(building)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(building.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal - Only shows when editingBuilding is set */}
      {editingBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Building: {editingBuilding.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Building Name</label>
                <Input
                  value={editingBuilding.name}
                  onChange={(e) => updateEditingField('name', e.target.value)}
                  placeholder="Building Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={editingBuilding.address}
                  onChange={(e) => updateEditingField('address', e.target.value)}
                  placeholder="Address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={editingBuilding.city}
                    onChange={(e) => updateEditingField('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State (County)</label>
                  <Input
                    value={editingBuilding.state}
                    onChange={(e) => updateEditingField('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={editingBuilding.building_type} 
                    onValueChange={(value) => updateEditingField('building_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={editingBuilding.status} 
                    onValueChange={(value) => updateEditingField('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Units</label>
                <Input
                  type="number"
                  // Ensure value is a string representation of the number for the input field
                  value={String(editingBuilding.total_units)}
                  onChange={(e) => updateEditingField('total_units', e.target.value)}
                  placeholder="Total Units"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editingBuilding.description}
                  onChange={(e) => updateEditingField('description', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                  placeholder="Building description"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Info</label>
                <Input
                  value={editingBuilding.contact_info}
                  onChange={(e) => updateEditingField('contact_info', e.target.value)}
                  placeholder="Contact Person/Number"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={cancelEdit} className="flex-1">
                  Cancel
                </Button>
                {/* 💡 Call handleEdit only if editingBuilding is not null, ensuring the latest state is passed */}
                <Button onClick={() => editingBuilding && handleEdit(editingBuilding)} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center">Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete this building? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} className="flex-1">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}