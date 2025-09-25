"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MapPin, Bed, Bath, Square, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { fetchVacantUnits } from "@/lib/supabase-data"
import { useToast } from "@/components/ui/use-toast"

interface VacantUnit {
  id: string
  title: string
  description: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  rent_amount: number
  selling_price: number
  address: string
  city: string
  state: string
  images: string[]
  status: string
  category: string
  created_at: string
  building_name: string
  amenities: string[]
  available_from: string
}

export default function VacantUnitsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [units, setUnits] = useState<VacantUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const [selectedUnit, setSelectedUnit] = useState<VacantUnit | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<VacantUnit | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadVacantUnits()
    }
  }, [user?.id])

  const loadVacantUnits = async () => {
    try {
      setLoading(true)
      const data = await fetchVacantUnits()
      setUnits(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading vacant units:", error)
      setUnits([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (unit: VacantUnit) => {
    setUnitToDelete(unit)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!unitToDelete) return

    try {
      const response = await fetch(`/api/vacant-units/${unitToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUnits(units.filter((unit) => unit.id !== unitToDelete.id))
        setShowDeleteModal(false)
        setUnitToDelete(null)
        toast({
          title: "Unit deleted",
          description: `"${unitToDelete.title}" has been removed.`,
          variant: "success",
        })
      } else if (response.status === 404) {
        setUnits(units.filter((unit) => unit.id !== unitToDelete.id))
        setShowDeleteModal(false)
        setUnitToDelete(null)
        toast({
          title: "Already removed",
          description: `"${unitToDelete.title}" was already deleted.`,
          variant: "default",
        })
      } else {
        const errorData = await response.text()
        console.error("Delete failed:", response.status, errorData)
        toast({
          title: "Delete failed",
          description: `Error ${response.status}: ${errorData}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error deleting unit:", error)
      toast({
        title: "Network error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleViewUnit = (unit: VacantUnit) => {
    setSelectedUnit(unit)
    setShowViewModal(true)
  }

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || unit.status === filterStatus
    const matchesType = filterType === "all" || unit.property_type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="w-full space-y-4 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Vacant Units</h1>
          <Button asChild>
            <Link href="/new-vacant-unit">
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vacant Units</h1>
          <p className="text-gray-600 mt-1">Manage your available properties</p>
        </div>
        <Button asChild>
          <Link href="/new-vacant-unit">
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by title, address, or city..."
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Units Grid */}
      {filteredUnits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vacant units found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all" || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first vacant unit"}
              </p>
              <Button asChild>
                <Link href="/new-vacant-unit">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Unit
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={unit.images?.[0] || "/placeholder.svg?height=200&width=300"}
                  alt={unit.title}
                  className="w-full h-48 object-cover"
                />
                <Badge
                  className={`absolute top-2 right-2 ${unit.status === "available"
                      ? "bg-green-500"
                      : unit.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                >
                  {unit.status}
                </Badge>
                {unit.category && <Badge className="absolute top-2 left-2 bg-blue-500">{unit.category}</Badge>}
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{unit.title}</h3>

                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="line-clamp-1">
                      {unit.address}, {unit.city}
                    </span>
                  </div>

                  {unit.building_name && <p className="text-sm text-gray-600">Building: {unit.building_name}</p>}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {unit.bedrooms}
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      {unit.bathrooms}
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      {unit.square_feet} sq ft
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {unit.category === "for sale" ? (
                        <p className="text-lg font-bold text-green-600">{formatCurrency(unit.selling_price)}</p>
                      ) : (
                        <p className="text-lg font-bold text-green-600">{formatCurrency(unit.rent_amount)}/month</p>
                      )}
                      <p className="text-xs text-gray-500 capitalize">{unit.property_type}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewUnit(unit)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(unit)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Unit Modal */}
      {showViewModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedUnit.title}</h2>
                <Button variant="outline" size="sm" onClick={() => setShowViewModal(false)}>
                  ✕
                </Button>
              </div>

              {/* Image Gallery */}
              {selectedUnit.images && selectedUnit.images.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedUnit.images.map((image, index) => (
                      <img
                        key={index}
                        src={image || "/placeholder.svg"}
                        alt={`${selectedUnit.title} - Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Property Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>
                          {selectedUnit.address}, {selectedUnit.city}, {selectedUnit.state}
                        </span>
                      </div>
                      {selectedUnit.building_name && (
                        <p>
                          <strong>Building:</strong> {selectedUnit.building_name}
                        </p>
                      )}
                      <p>
                        <strong>Property Type:</strong> {selectedUnit.property_type}
                      </p>
                      <p>
                        <strong>Status:</strong>
                        <Badge
                          className={`ml-2 ${selectedUnit.status === "available"
                              ? "bg-green-500"
                              : selectedUnit.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                        >
                          {selectedUnit.status}
                        </Badge>
                      </p>
                      {selectedUnit.category && (
                        <p>
                          <strong>Category:</strong> {selectedUnit.category}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Specifications</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Bed className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-sm">{selectedUnit.bedrooms} Beds</p>
                      </div>
                      <div className="text-center">
                        <Bath className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-sm">{selectedUnit.bathrooms} Baths</p>
                      </div>
                      <div className="text-center">
                        <Square className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-sm">{selectedUnit.square_feet} sq ft</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Pricing</h3>
                    {selectedUnit.category === "for sale" ? (
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedUnit.selling_price)}</p>
                    ) : (
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedUnit.rent_amount)}/month
                      </p>
                    )}
                  </div>

                  {selectedUnit.amenities && selectedUnit.amenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedUnit.amenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary">
                            {amenity.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUnit.available_from && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Availability</h3>
                      <p>Available from: {new Date(selectedUnit.available_from).toLocaleDateString()}</p>
                    </div>
                  )}

                  {selectedUnit.description && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Description</h3>
                      <p className="text-gray-700">{selectedUnit.description}</p>
                    </div>
                  )}

                 
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && unitToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Unit</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "{unitToDelete.title}"? This action cannot be undone.
              </p>

              {/* Offer Moving Services button ABOVE Cancel/Delete */}
              <div className="mb-4">
                <Button
                  variant="secondary"
                  asChild
                  className="bg-blue-600 text-white hover:bg-blue-700 w-full"
                >
                  <Link href="/request-move">Offer Moving Services</Link>
                </Button>
              </div>

              {/* Cancel / Delete buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setUnitToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Unit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
