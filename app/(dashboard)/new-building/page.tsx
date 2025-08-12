"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  MapPin,
  Search,
  Building2,
  MapIcon,
  DollarSign,
  Shield,
  Users,
  CheckCircle,
  Upload,
  X,
  CalendarIcon,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { BuildingCacheManager } from "@/lib/building-cache"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface FormData {
  name: string
  address: string
  city: string
  county: string
  postalCode: string
  buildingType: string
  totalUnits: string
  floors: string
  yearBuilt: string
  description: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
  managementCompany: string
  parkingSpaces: string
  elevators: string
  buildingIncome: string
  status: string
  constructionDate: Date | undefined
  amenities: string[]
  securityFeatures: string[]
  utilities: string[]
  images: string[]
}

const STEPS = [
  { id: 1, title: "Basic Info", icon: Building2, question: "Tell us about your building" },
  { id: 2, title: "Location", icon: MapIcon, question: "Where is your building located?" },
  { id: 3, title: "Financial", icon: DollarSign, question: "What are the financial details?" },
  { id: 4, title: "Features", icon: Shield, question: "What amenities and features are available?" },
  { id: 5, title: "Management", icon: Users, question: "Who manages this building?" },
  { id: 6, title: "Photos", icon: Upload, question: "Add photos of your building" },
  { id: 7, title: "Review", icon: CheckCircle, question: "Review your building details" },
]

export default function NewBuildingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    city: "",
    county: "",
    postalCode: "",
    buildingType: "residential",
    totalUnits: "",
    floors: "",
    yearBuilt: "",
    description: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    managementCompany: "",
    parkingSpaces: "",
    elevators: "",
    buildingIncome: "",
    status: "active",
    constructionDate: undefined,
    amenities: [],
    securityFeatures: [],
    utilities: ["electricity", "water"],
    images: [],
  })

  const [locationSearch, setLocationSearch] = useState("")
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{
      display_name: string
      lat: string
      lon: string
    }>
  >([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  // Debug auth state
  useEffect(() => {
    console.log("Auth state:", {
      userExists: !!user,
      userId: user?.id,
      userEmail: user?.email,
      companyId: user?.company_account_id,
    })
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const searchLocationSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setLocationSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearchingLocation(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        setLocationSuggestions(data)
        setShowSuggestions(true)
      } else {
        setLocationSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error("Error searching location:", error)
      setLocationSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsSearchingLocation(false)
    }
  }

  const selectLocation = (suggestion: any) => {
    const coordinates = {
      lat: Number.parseFloat(suggestion.lat),
      lng: Number.parseFloat(suggestion.lon),
    }
    setLocationCoordinates(coordinates)
    setLocationSearch(suggestion.display_name)
    setShowSuggestions(false)

    // Auto-fill address fields if they're empty
    if (!formData.city && suggestion.display_name) {
      const parts = suggestion.display_name.split(", ")
      if (parts.length > 0) {
        setFormData((prev) => ({
          ...prev,
          city:
            parts.find(
              (part) =>
                part.toLowerCase().includes("nairobi") ||
                part.toLowerCase().includes("mombasa") ||
                part.toLowerCase().includes("kisumu"),
            ) || parts[0],
        }))
      }
    }
  }

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    const newImages: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = `${Date.now()}-${i}`

      try {
        // Initialize progress
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))

        // Create file path
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `building-images/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage.from("property-images").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

        if (error) {
          console.error("Upload error:", error)
          continue
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(filePath)

        newImages.push(publicUrl)
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }))
      } catch (error) {
        console.error("Error uploading file:", error)
      }
    }

    // Update form data with new images
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }))

    setIsUploading(false)
    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress({})
    }, 2000)
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name.trim() && formData.buildingType && formData.totalUnits)
      case 2:
        return !!(formData.address.trim() && formData.city.trim())
      case 3:
        return !!formData.status
      case 4:
        return true // Optional step
      case 5:
        return true // Optional step
      case 6:
        return true // Optional step
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setDebugInfo(null)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Please enter a building name.")
      }
      if (!formData.address.trim()) {
        throw new Error("Please enter a building address.")
      }
      if (!formData.city.trim()) {
        throw new Error("Please enter a city.")
      }

      // Check if user is authenticated
      if (!user) {
        throw new Error("You must be logged in to create a building")
      }

      // Get user's company account ID from the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_account_id, role")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        throw new Error("Could not verify your account. Please try again.")
      }

      const companyAccountId = userData?.company_account_id || user.id

      console.log("User authenticated:", {
        id: user.id,
        email: user.email,
        company_account_id: companyAccountId,
        role: userData?.role,
      })

      // Prepare the data to match exact database schema
      const buildingData = {
        company_account_id: companyAccountId,
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        county: formData.county.trim() || null,
        postal_code: formData.postalCode.trim() || null,
        building_type: formData.buildingType || "residential",
        total_units: formData.totalUnits ? Number.parseInt(formData.totalUnits) : null,
        floors: formData.floors ? Number.parseInt(formData.floors) : null,
        year_built: formData.yearBuilt ? Number.parseInt(formData.yearBuilt) : null,
        description: formData.description.trim() || null,
        amenities: formData.amenities,
        security_features: formData.securityFeatures,
        utilities: formData.utilities,
        parking_spaces: formData.parkingSpaces ? Number.parseInt(formData.parkingSpaces) : null,
        elevators: formData.elevators ? Number.parseInt(formData.elevators) : null,
        management_company: formData.managementCompany.trim() || null,
        contact_person: formData.contactPerson.trim() || null,
        contact_phone: formData.contactPhone.trim() || null,
        contact_email: formData.contactEmail.trim() || null,
        images: formData.images,
        status: formData.status,
        building_income: formData.buildingIncome ? Number.parseFloat(formData.buildingIncome) : null,
        latitude: locationCoordinates?.lat || null,
        longitude: locationCoordinates?.lng || null,
      }

      console.log("Inserting building with data:", buildingData)

      // Verify supabase client is available
      if (!supabase) {
        throw new Error("Database connection not available")
      }

      // Insert building directly using imported supabase client
      const { data: insertedBuilding, error: insertError } = await supabase
        .from("buildings")
        .insert([buildingData])
        .select()
        .single()

      if (insertError) {
        console.error("Database insert error:", insertError)
        throw new Error(`Failed to create building: ${insertError.message}`)
      }

      console.log("Building created successfully:", insertedBuilding)

      // Clear building cache
      BuildingCacheManager.clearCache()

      // Show success message and redirect
      alert("Building created successfully!")

      // Use replace instead of push to avoid back button issues
      router.replace("/buildings")
    } catch (error) {
      console.error("Error creating building:", error)
      setErrorMessage(error instanceof Error ? error.message : String(error))
      setDebugInfo({
        userState: {
          exists: !!user,
          id: user?.id,
          email: user?.email,
          companyId: user?.company_account_id,
        },
        supabaseAvailable: !!supabase,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tell us about your building
              </CardTitle>
              <CardDescription>Let's start with the basic information about your building</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">What is the name of your building? *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Skyline Apartments, Downtown Plaza"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingType">What type of building is this?</Label>
                <Select
                  value={formData.buildingType}
                  onValueChange={(value) => handleSelectChange("buildingType", value)}
                >
                  <SelectTrigger id="buildingType">
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="mixed_use">Mixed Use</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalUnits">How many units are in this building? *</Label>
                  <Input
                    id="totalUnits"
                    name="totalUnits"
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.totalUnits}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floors">How many floors does it have?</Label>
                  <Input
                    id="floors"
                    name="floors"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.floors}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">What year was it built?</Label>
                  <Input
                    id="yearBuilt"
                    name="yearBuilt"
                    type="number"
                    placeholder="e.g., 2020"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>When was construction completed?</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.constructionDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.constructionDate ? (
                          format(formData.constructionDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.constructionDate}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, constructionDate: date }))}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Tell us more about this building</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the building features, unique characteristics, target tenants, etc."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Where is your building located?
              </CardTitle>
              <CardDescription>Help us pinpoint the exact location of your building</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="locationSearch">Search for your building's location</Label>
                <div className="relative">
                  <Input
                    id="locationSearch"
                    placeholder="e.g., Nairobi, Westlands, Karen"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value)
                      searchLocationSuggestions(e.target.value)
                    }}
                    onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Search className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectLocation(suggestion)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate">{suggestion.display_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {locationCoordinates && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Location found: {locationCoordinates.lat.toFixed(6)}, {locationCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">What is the street address? *</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="e.g., 123 Main Street, Building A"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Which city? *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g., Nairobi"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county">Which county?</Label>
                  <Input
                    id="county"
                    name="county"
                    placeholder="e.g., Nairobi County"
                    value={formData.county}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code?</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="e.g., 00100"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                What are the financial details?
              </CardTitle>
              <CardDescription>Tell us about the building's income and operational status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildingIncome">What is the monthly building income? (KES)</Label>
                  <Input
                    id="buildingIncome"
                    name="buildingIncome"
                    type="number"
                    placeholder="e.g., 125000"
                    value={formData.buildingIncome}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-muted-foreground">Total rental income from all units</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">What is the current building status? *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active - Fully operational</SelectItem>
                      <SelectItem value="maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="archived">Archived - Not in use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parkingSpaces">How many parking spaces?</Label>
                  <Input
                    id="parkingSpaces"
                    name="parkingSpaces"
                    type="number"
                    placeholder="e.g., 25"
                    value={formData.parkingSpaces}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elevators">How many elevators?</Label>
                  <Input
                    id="elevators"
                    name="elevators"
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.elevators}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                What amenities and features are available?
              </CardTitle>
              <CardDescription>
                Select all the amenities, security features, and utilities your building offers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">What amenities does your building have?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: "swimming_pool", label: "Swimming Pool" },
                      { id: "gym", label: "Gym/Fitness Center" },
                      { id: "rooftop_garden", label: "Rooftop Garden" },
                      { id: "playground", label: "Playground" },
                      { id: "laundry_room", label: "Laundry Room" },
                      { id: "concierge", label: "Concierge Service" },
                      { id: "business_center", label: "Business Center" },
                      { id: "conference_room", label: "Conference Room" },
                      { id: "storage_units", label: "Storage Units" },
                      { id: "bike_storage", label: "Bike Storage" },
                    ].map((amenity) => (
                      <label key={amenity.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                amenities: [...prev.amenities, amenity.id],
                              }))
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                amenities: prev.amenities.filter((a) => a !== amenity.id),
                              }))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">What security features are in place?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: "keycard_access", label: "Keycard Access" },
                      { id: "24/7_security", label: "24/7 Security Guard" },
                      { id: "video_surveillance", label: "Video Surveillance" },
                      { id: "intercom_system", label: "Intercom System" },
                      { id: "security_gates", label: "Security Gates" },
                      { id: "alarm_system", label: "Alarm System" },
                      { id: "motion_sensors", label: "Motion Sensors" },
                      { id: "access_control", label: "Access Control" },
                    ].map((feature) => (
                      <label key={feature.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.securityFeatures.includes(feature.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                securityFeatures: [...prev.securityFeatures, feature.id],
                              }))
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                securityFeatures: prev.securityFeatures.filter((f) => f !== feature.id),
                              }))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Which utilities are included?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: "electricity", label: "Electricity" },
                      { id: "water", label: "Water" },
                      { id: "gas", label: "Gas" },
                      { id: "internet", label: "Internet" },
                      { id: "cable_tv", label: "Cable TV" },
                      { id: "trash_collection", label: "Trash Collection" },
                    ].map((utility) => (
                      <label key={utility.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.utilities.includes(utility.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                utilities: [...prev.utilities, utility.id],
                              }))
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                utilities: prev.utilities.filter((u) => u !== utility.id),
                              }))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{utility.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Who manages this building?
              </CardTitle>
              <CardDescription>Provide management and contact information for this building</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="managementCompany">What is the management company name?</Label>
                  <Input
                    id="managementCompany"
                    name="managementCompany"
                    placeholder="e.g., ABC Property Management"
                    value={formData.managementCompany}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Who is the main contact person?</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    placeholder="e.g., John Doe"
                    value={formData.contactPerson}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">What is the contact phone number?</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="e.g., +254712345678"
                    value={formData.contactPhone}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">What is the contact email?</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="e.g., contact@building.com"
                    value={formData.contactEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Add photos of your building
              </CardTitle>
              <CardDescription>
                Upload high-quality photos to showcase your building (optional but recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const files = e.dataTransfer.files
                    if (files.length > 0) {
                      handleImageUpload(files)
                    }
                  }}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleImageUpload(e.target.files)
                      }
                    }}
                  />
                </div>

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    {Object.entries(uploadProgress).map(([fileId, progress]) => (
                      <div key={fileId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Uploading image...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="space-y-3">
                    <Label>Uploaded Photos ({formData.images.length})</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Building photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          {index === 0 && <Badge className="absolute top-2 left-2 bg-blue-500">Main Photo</Badge>}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Review your building details
              </CardTitle>
              <CardDescription>Please review all the information before creating your building listing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Basic Information</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Name:</span> {formData.name}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span> {formData.buildingType}
                      </p>
                      <p>
                        <span className="font-medium">Units:</span> {formData.totalUnits}
                      </p>
                      <p>
                        <span className="font-medium">Floors:</span> {formData.floors || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Location</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Address:</span> {formData.address}
                      </p>
                      <p>
                        <span className="font-medium">City:</span> {formData.city}
                      </p>
                      <p>
                        <span className="font-medium">County:</span> {formData.county || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Financial Details</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Monthly Income:</span>{" "}
                        {formData.buildingIncome
                          ? `KES ${Number(formData.buildingIncome).toLocaleString()}`
                          : "Not specified"}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span> {formData.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Features</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Amenities:</span>{" "}
                        {formData.amenities.length > 0 ? formData.amenities.join(", ") : "None selected"}
                      </p>
                      <p>
                        <span className="font-medium">Security:</span>{" "}
                        {formData.securityFeatures.length > 0 ? formData.securityFeatures.join(", ") : "None selected"}
                      </p>
                      <p>
                        <span className="font-medium">Utilities:</span> {formData.utilities.join(", ")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Management</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Company:</span> {formData.managementCompany || "Not specified"}
                      </p>
                      <p>
                        <span className="font-medium">Contact:</span> {formData.contactPerson || "Not specified"}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {formData.contactPhone || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Photos</h4>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{formData.images.length} photo(s) uploaded</p>
                    </div>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
                  <p className="font-medium">Error: {errorMessage}</p>
                  {debugInfo && (
                    <div className="mt-2">
                      <details>
                        <summary className="cursor-pointer text-sm">Debug Information</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Building</h1>
        <p className="text-muted-foreground">Let's add your building step by step</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step) => {
          const Icon = step.icon
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCompleted && "bg-green-100 text-green-800",
                isCurrent && "bg-blue-100 text-blue-800",
                !isCompleted && !isCurrent && "bg-gray-100 text-gray-600",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{step.title}</span>
              {isCompleted && <CheckCircle className="h-3 w-3" />}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit}>
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? "Creating Building..." : "Create Building"}
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
