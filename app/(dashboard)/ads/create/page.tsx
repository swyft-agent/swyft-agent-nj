"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, DollarSign, Eye, Target, MapPin } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { fetchVacantUnits } from "@/lib/supabase-data"

interface VacantUnit {
  id: string
  title: string
  property_type: string
  rent_amount: number
  selling_price: number
  category: string
  address: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  images: string[]
  status: string
}

interface AdFormData {
  vacant_unit_id: string
  title: string
  description: string
  budget: number
  duration_days: number
  target_audience: string
  platforms: string[]
  status: string
  user_id: string
  company_account_id: string | null
}

const PLATFORMS = ["facebook", "instagram", "google", "twitter", "linkedin", "tiktok"]
const TARGET_AUDIENCES = ["young_professionals", "families", "students", "seniors", "investors", "general"]

// Helper function to validate UUID
const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid || uuid === "null" || uuid === "" || uuid === "undefined") return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function CreateAdPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vacantUnits, setVacantUnits] = useState<VacantUnit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<VacantUnit | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<AdFormData>({
    vacant_unit_id: "",
    title: "",
    description: "",
    budget: 0,
    duration_days: 7,
    target_audience: "general",
    platforms: ["facebook"],
    status: "draft",
    user_id: "",
    company_account_id: null,
  })

  useEffect(() => {
    if (user?.id && isValidUUID(user.id)) {
      setFormData((prev) => ({
        ...prev,
        user_id: user.id,
        company_account_id:
          user.company_account_id && isValidUUID(user.company_account_id) ? user.company_account_id : null,
      }))
      loadVacantUnits()
    }
  }, [user?.id, user?.company_account_id])

  const loadVacantUnits = async () => {
    try {
      const units = await fetchVacantUnits()
      // Only show available units that belong to the current user
      const availableUnits = units.filter((unit: VacantUnit) => unit.status === "available")
      setVacantUnits(availableUnits)
    } catch (error) {
      console.error("Error loading vacant units:", error)
      setErrors({ general: "Failed to load vacant units" })
    }
  }

  const handleInputChange = (field: keyof AdFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleUnitSelect = (unitId: string) => {
    const unit = vacantUnits.find((u) => u.id === unitId)
    setSelectedUnit(unit || null)
    handleInputChange("vacant_unit_id", unitId)

    if (unit) {
      // Auto-populate title and description based on selected unit
      handleInputChange("title", `${unit.title} - Now Available`)
      handleInputChange(
        "description",
        `${unit.property_type} for ${unit.category} in ${unit.city}, ${unit.state}. ${unit.bedrooms} bed, ${unit.bathrooms} bath. ${
          unit.category === "for sale"
            ? `Selling price: KSh ${unit.selling_price?.toLocaleString()}`
            : `Monthly rent: KSh ${unit.rent_amount?.toLocaleString()}`
        }`,
      )
    }
  }

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.vacant_unit_id) newErrors.vacant_unit_id = "Please select a vacant unit"
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.budget || formData.budget <= 0) newErrors.budget = "Budget must be greater than 0"
    if (!formData.duration_days || formData.duration_days <= 0)
      newErrors.duration_days = "Duration must be greater than 0"
    if (formData.platforms.length === 0) newErrors.platforms = "Select at least one platform"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    // Validate required user ID before submission
    if (!user?.id || !isValidUUID(user.id)) {
      setErrors({ general: "Invalid user ID. Please log in again." })
      return
    }

    setLoading(true)

    try {
      const sanitizedData = {
        vacant_unit_id: formData.vacant_unit_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: formData.budget,
        duration_days: formData.duration_days,
        target_audience: formData.target_audience,
        platforms: formData.platforms,
        status: formData.status,
        user_id: user.id,
        company_account_id:
          user.company_account_id && isValidUUID(user.company_account_id) ? user.company_account_id : null,
      }

      console.log("Submitting ad data:", sanitizedData)

      const { data, error } = await supabase.from("ads").insert([sanitizedData]).select().single()

      if (error) {
        console.error("Error creating ad:", error)
        setErrors({ general: `Failed to create ad: ${error.message}` })
        return
      }

      console.log("Ad created successfully:", data)
      router.push("/ads")
    } catch (error: any) {
      console.error("Error creating ad:", error)
      setErrors({ general: `Failed to create ad: ${error.message || "Unknown error"}` })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Please log in to create an ad.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Ad Campaign</h1>
          <p className="text-muted-foreground mt-2">Promote your vacant units to attract more tenants</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Select Vacant Unit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Select Property to Advertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vacantUnits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No vacant units available for advertising</p>
                    <Button onClick={() => router.push("/new-vacant-unit")}>Add Vacant Unit</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vacantUnits.map((unit) => (
                      <Card
                        key={unit.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.vacant_unit_id === unit.id ? "ring-2 ring-primary bg-primary/5" : ""
                        }`}
                        onClick={() => handleUnitSelect(unit.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm truncate">{unit.title}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {unit.property_type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {unit.city}, {unit.state}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                {unit.bedrooms} bed, {unit.bathrooms} bath
                              </span>
                              <span className="font-semibold text-sm">
                                KSh{" "}
                                {unit.category === "for sale"
                                  ? unit.selling_price?.toLocaleString()
                                  : unit.rent_amount?.toLocaleString()}
                                {unit.category === "for rent" && "/mo"}
                              </span>
                            </div>
                            {unit.images && unit.images.length > 0 && (
                              <img
                                src={unit.images[0] || "/placeholder.svg"}
                                alt={unit.title}
                                className="w-full h-24 object-cover rounded mt-2"
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {errors.vacant_unit_id && <p className="text-sm text-red-500">{errors.vacant_unit_id}</p>}
              </CardContent>
            </Card>

            {/* Ad Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Ad Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    Ad Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Beautiful 2BR Apartment in Westlands - Now Available"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">
                    Ad Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what makes this property special and why people should be interested..."
                    rows={4}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => handleInputChange("target_audience", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_AUDIENCES.map((audience) => (
                        <SelectItem key={audience} value={audience}>
                          {audience.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Campaign Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">
                      Budget (KSh) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      min="1"
                      value={formData.budget || ""}
                      onChange={(e) => handleInputChange("budget", Number.parseFloat(e.target.value) || 0)}
                      placeholder="5000"
                      className={errors.budget ? "border-red-500" : ""}
                    />
                    {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget}</p>}
                  </div>

                  <div>
                    <Label htmlFor="duration_days">
                      Duration (Days) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="duration_days"
                      type="number"
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) => handleInputChange("duration_days", Number.parseInt(e.target.value) || 1)}
                      className={errors.duration_days ? "border-red-500" : ""}
                    />
                    {errors.duration_days && <p className="text-sm text-red-500 mt-1">{errors.duration_days}</p>}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Advertising Platforms <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {PLATFORMS.map((platform) => (
                      <div
                        key={platform}
                        onClick={() => handlePlatformToggle(platform)}
                        className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.platforms.includes(platform)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <span className="text-sm font-medium capitalize">{platform}</span>
                      </div>
                    ))}
                  </div>
                  {errors.platforms && <p className="text-sm text-red-500 mt-1">{errors.platforms}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Ad Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUnit ? (
                  <div className="space-y-4">
                    {selectedUnit.images && selectedUnit.images.length > 0 && (
                      <img
                        src={selectedUnit.images[0] || "/placeholder.svg"}
                        alt={selectedUnit.title}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">
                        {formData.title || "Your ad title will appear here"}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formData.description || "Your ad description will appear here"}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          {selectedUnit.bedrooms} bed, {selectedUnit.bathrooms} bath
                        </span>
                        <span className="font-semibold">
                          KSh{" "}
                          {selectedUnit.category === "for sale"
                            ? selectedUnit.selling_price?.toLocaleString()
                            : selectedUnit.rent_amount?.toLocaleString()}
                          {selectedUnit.category === "for rent" && "/mo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {selectedUnit.city}, {selectedUnit.state}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span>Budget:</span>
                        <span>KSh {formData.budget?.toLocaleString() || "0"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span>Duration:</span>
                        <span>{formData.duration_days} days</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Platforms:</span>
                        <span>{formData.platforms.length} selected</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Select a vacant unit to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {errors.general && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => router.push("/ads")}>
            Cancel
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                handleInputChange("status", "draft")
                handleSubmit()
              }}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => {
                handleInputChange("status", "active")
                handleSubmit()
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Launch Campaign"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
