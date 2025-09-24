"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  MapPin,
  DollarSign,
  Home,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  CalendarIcon,
  User,
  Settings,
  Camera,
  Trash2,
  Check,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface FormData {
  company_account_id: string | null
  user_id: string
  title: string
  description: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  rent_amount: number
  deposit_amount: number
  selling_price: number
  address: string
  city: string
  state: string
  zip_code: string
  latitude: number
  longitude: number
  amenities: string[]
  pet_policy: string
  parking_available: boolean
  utilities_included: string[]
  images: string[]
  virtual_tour_url: string
  status: string
  featured: boolean
  created_by: string
  contact_info: string
  building_name: string
  viewing_fee: number
  house_number: string
  frequency: number
  role: string
  available_from: string
  category: string
}

interface UploadProgress {
  file: File
  progress: number
  url?: string
  error?: string
  status: "uploading" | "completed" | "error"
}

const PROPERTY_TYPES = ["apartment", "studio", "condo", "house", "townhouse", "duplex", "loft", "penthouse"]
const PET_POLICIES = ["allowed", "not_allowed", "cats_only", "dogs_only", "deposit_required"]
const UTILITIES = ["water", "electricity", "gas", "internet", "cable", "trash", "sewer", "heating", "cooling"]
const AMENITIES = [
  "pool",
  "gym",
  "parking",
  "laundry",
  "balcony",
  "dishwasher",
  "air_conditioning",
  "heating",
  "hardwood_floors",
  "carpet",
  "tile",
  "granite_counters",
  "stainless_appliances",
  "walk_in_closet",
  "fireplace",
  "patio",
  "garden",
  "elevator",
  "doorman",
  "concierge",
]

const STEPS = [
  { id: 1, title: "Who's Uploading", description: "Your role", icon: User },
  { id: 2, title: "Property Type", description: "What type of property", icon: Home },
  { id: 3, title: "Basic Details", description: "Property specifications", icon: Settings },
  { id: 4, title: "Location", description: "Address & location", icon: MapPin },
  { id: 5, title: "Pricing", description: "Rent or sale pricing", icon: DollarSign },
  { id: 6, title: "Availability", description: "When it's available", icon: CalendarIcon },
  { id: 7, title: "Images", description: "Property photos", icon: Camera },
  { id: 8, title: "Features", description: "Amenities & policies", icon: Settings },
  { id: 9, title: "Review", description: "Final review", icon: CheckCircle },
]

// Helper function to validate UUID
const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid || uuid === "null" || uuid === "" || uuid === "undefined") return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function NewVacantUnitPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const [formData, setFormData] = useState<FormData>({
    company_account_id: null,
    user_id: "",
    title: "",
    description: "",
    property_type: "",
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 0,
    rent_amount: 0,
    deposit_amount: 0,
    selling_price: 0,
    address: "",
    city: "",
    state: "",
    zip_code: "",
    latitude: 0,
    longitude: 0,
    amenities: [],
    pet_policy: "not_allowed",
    parking_available: false,
    utilities_included: [],
    images: [],
    virtual_tour_url: "",
    status: "available",
    featured: false,
    created_by: "",
    contact_info: "",
    building_name: "",
    viewing_fee: 0,
    house_number: "",
    frequency: 1,
    role: "agent",
    available_from: new Date().toISOString().split("T")[0],
    category: "for rent",
  })

  useEffect(() => {
    if (user?.id && isValidUUID(user.id)) {
      setFormData((prev) => ({
        ...prev,
        company_account_id:
          user.company_account_id && isValidUUID(user.company_account_id) ? user.company_account_id : null,
        user_id: user.id,
        created_by: user.id,
      }))
    }
  }, [user?.id, user?.company_account_id])

  const handleInputChange = (field: keyof FormData, value: any) => {
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

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleUtilityToggle = (utility: string) => {
    setFormData((prev) => ({
      ...prev,
      utilities_included: prev.utilities_included.includes(utility)
        ? prev.utilities_included.filter((item) => item !== utility)
        : [...prev.utilities_included, utility],
    }))
  }

  const handleImageUpload = async (files: FileList) => {
    if (!files.length || !user?.id || !isValidUUID(user.id)) return

    const newUploads: UploadProgress[] = Array.from(files).map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadProgress((prev) => [...prev, ...newUploads])

    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i]
      const uploadIndex = uploadProgress.length + i

      try {
        const fileExt = upload.file.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const updated = [...prev]
            if (updated[uploadIndex] && updated[uploadIndex].progress < 90) {
              updated[uploadIndex].progress += 10
            }
            return updated
            
          })
        }, 200)

        const { data, error } = await supabase.storage.from("property-images").upload(fileName, upload.file)

        clearInterval(progressInterval)

        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(fileName)

        setUploadProgress((prev) => {
          const updated = [...prev]
          if (updated[uploadIndex]) {
            updated[uploadIndex].progress = 100
            updated[uploadIndex].status = "completed"
            updated[uploadIndex].url = publicUrl
          }
          return updated
        })

        setFormData((prevForm) => ({
          ...prevForm,
          images: [...prevForm.images, publicUrl],
        }))
      } catch (error) {
        setUploadProgress((prev) => {
          const updated = [...prev]
          if (updated[uploadIndex]) {
            updated[uploadIndex].error = "Upload failed"
            updated[uploadIndex].status = "error"
            updated[uploadIndex].progress = 0
          }
          return updated
        })
      }
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const removeUploadProgress = (index: number) => {
    setUploadProgress((prev) => prev.filter((_, i) => i !== index))
  }

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1:
        if (!formData.role) newErrors.role = "Please select your role"
        break
      case 2:
        if (!formData.property_type) newErrors.property_type = "Property type is required"
        break
      case 3:
        if (!formData.title.trim()) newErrors.title = "Title is required"
        if (!formData.description.trim()) newErrors.description = "Description is required"
        if (formData.bedrooms < 0) newErrors.bedrooms = "Bedrooms must be 0 or greater"
        if (formData.bathrooms < 0) newErrors.bathrooms = "Bathrooms must be 0 or greater"
        if (formData.square_feet <= 0) newErrors.square_feet = "Square feet must be greater than 0"
        if (!formData.building_name.trim()) newErrors.building_name = "Building name is required"
        break
      case 4:
        if (!formData.address.trim()) newErrors.address = "Address is required"
        if (!formData.city.trim()) newErrors.city = "City is required"
        if (!formData.state.trim()) newErrors.state = "State is required"
        if (!formData.zip_code.trim()) newErrors.zip_code = "ZIP code is required"
        break
      case 5:
        if (formData.category === "for sale") {
          if (!formData.selling_price || formData.selling_price <= 0) {
            newErrors.selling_price = "Selling price is required and must be greater than 0"
          }
        } else {
          if (!formData.rent_amount || formData.rent_amount <= 0) {
            newErrors.rent_amount = "Rent amount must be greater than 0"
          }
          if (formData.deposit_amount !== null && formData.deposit_amount < 0) {
            newErrors.deposit_amount = "Deposit amount cannot be negative"
          }
        }
        break
      case 6:
        if (!formData.available_from) newErrors.available_from = "Available from date is required"
        if (formData.frequency < 1) newErrors.frequency = "Number of similar units must be at least 1"
        break
      case 8:
        if (!formData.contact_info.trim()) newErrors.contact_info = "Contact info is required"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    // Validate required user ID before submission
    if (!user?.id || !isValidUUID(user.id)) {
      setErrors({ general: "Invalid user ID. Please log in again." })
      return
    }

    setLoading(true)

    try {
      // Prepare sanitized data with proper null handling
      const { data: profileData, error: profileError } = await supabase
            .from('users') // Assumes your users table holds the company_account_id
            .select('company_account_id')
            .eq('id', user.id)
            .single();

      if (profileError) {
          console.error("Error fetching user profile for submission:", profileError);
          setErrors({ general: "Failed to verify user profile. Please try again." });
          setLoading(false);
          return;
        }

      const sanitizedData = {
        user_id: user.id,
        created_by: user.id,
        company_account_id:profileData?.company_account_id || null, 
        title: formData.title.trim(),
        description: formData.description.trim(),
        property_type: formData.property_type,
        bedrooms: formData.bedrooms || 0,
        bathrooms: formData.bathrooms || 0,
        square_feet: formData.square_feet || 0,
        rent_amount: formData.rent_amount || 0,
        deposit_amount: formData.deposit_amount || 0,
        selling_price: formData.selling_price || 0,
        viewing_fee: formData.viewing_fee || 0,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        house_number: formData.house_number.trim(),
        building_name: formData.building_name.trim(),
        latitude: formData.latitude || 0,
        longitude: formData.longitude || 0,
        amenities: formData.amenities,
        pet_policy: formData.pet_policy,
        parking_available: formData.parking_available,
        utilities_included: formData.utilities_included,
        images: formData.images,
        virtual_tour_url: formData.virtual_tour_url.trim(),
        status: formData.status,
        featured: formData.featured,
        contact_info: formData.contact_info.trim(),
        frequency: formData.frequency || 1,
        role: formData.role,
        available_from: formData.available_from,
        category: formData.category,
      }

      console.log("Submitting vacant unit data:", sanitizedData)

      const { data, error } = await supabase.from("vacant_units").insert([sanitizedData]).select().single()

      if (error) {
        console.error("Error creating vacant unit:", error)
        setErrors({ general: `Failed to create vacant unit: ${error.message}` })
        return
      }

      console.log("Vacant unit created successfully:", data)
      router.push("/vacant-units")
    } catch (error: any) {
      console.error("Error creating vacant unit:", error)
      setErrors({ general: `Failed to create vacant unit: ${error.message || "Unknown error"}` })
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Please log in to add a vacant unit.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div>
              <User className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Who is uploading this unit?</h2>
              <p className="text-muted-foreground">This helps us understand your relationship to the property</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { value: "agent", label: "Agent", description: "Real estate agent" },
                { value: "landlord", label: "Landlord", description: "Property owner renting out" },
                { value: "owner", label: "Owner", description: "Property owner selling" },
              ].map((role) => (
                <Card
                  key={role.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.role === role.value ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleInputChange("role", role.value)}
                >
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold mb-1">{role.label}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 text-center">
            <div>
              <Home className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">What type of property is this?</h2>
              <p className="text-muted-foreground">Select the category that best describes your property</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {PROPERTY_TYPES.map((type) => (
                <Card
                  key={type}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.property_type === type ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleInputChange("property_type", type)}
                >
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold capitalize">{type}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tell us about this property</h2>
              <p className="text-muted-foreground">Provide the basic details and description</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <Label htmlFor="title">
                  Property Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Spacious 2BR Apartment in Westlands"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="building_name">
                  Building Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="building_name"
                  value={formData.building_name}
                  onChange={(e) => handleInputChange("building_name", e.target.value)}
                  placeholder="e.g., Westlands Heights, Karen Gardens"
                  className={errors.building_name ? "border-red-500" : ""}
                />
                {errors.building_name && <p className="text-sm text-red-500 mt-1">{errors.building_name}</p>}
              </div>

              <div>
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the property, its features, and what makes it special..."
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">
                    Bedrooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", Number.parseInt(e.target.value) || 0)}
                    className={errors.bedrooms ? "border-red-500" : ""}
                  />
                  {errors.bedrooms && <p className="text-sm text-red-500 mt-1">{errors.bedrooms}</p>}
                </div>

                <div>
                  <Label htmlFor="bathrooms">
                    Bathrooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange("bathrooms", Number.parseFloat(e.target.value) || 0)}
                    className={errors.bathrooms ? "border-red-500" : ""}
                  />
                  {errors.bathrooms && <p className="text-sm text-red-500 mt-1">{errors.bathrooms}</p>}
                </div>

                <div>
                  <Label htmlFor="square_feet">
                    Square Feet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="square_feet"
                    type="number"
                    min="1"
                    value={formData.square_feet}
                    onChange={(e) => handleInputChange("square_feet", Number.parseInt(e.target.value) || 0)}
                    className={errors.square_feet ? "border-red-500" : ""}
                  />
                  {errors.square_feet && <p className="text-sm text-red-500 mt-1">{errors.square_feet}</p>}
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Where is this property located?</h2>
              <p className="text-muted-foreground">Provide the complete address</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main Street"
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="house_number">House/Unit Number</Label>
                  <Input
                    id="house_number"
                    value={formData.house_number}
                    onChange={(e) => handleInputChange("house_number", e.target.value)}
                    placeholder="Apt 2B, Unit 101, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Nairobi"
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <Label htmlFor="state">
                    State/County <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Nairobi County"
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
                </div>

                <div>
                  <Label htmlFor="zip_code">
                    ZIP/Postal Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange("zip_code", e.target.value)}
                    placeholder="00100"
                    className={errors.zip_code ? "border-red-500" : ""}
                  />
                  {errors.zip_code && <p className="text-sm text-red-500 mt-1">{errors.zip_code}</p>}
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Is this unit for rent or for sale?</h2>
              <p className="text-muted-foreground">Choose the pricing model for your property</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={formData.category === "for rent" ? "font-medium" : "text-muted-foreground"}>
                    For Rent
                  </span>
                  <Switch
                    checked={formData.category === "for sale"}
                    onCheckedChange={(checked) => {
                      const category = checked ? "for sale" : "for rent"
                      handleInputChange("category", category)
                      if (category === "for sale") {
                        handleInputChange("rent_amount", 0)
                        handleInputChange("deposit_amount", 0)
                      } else {
                        handleInputChange("selling_price", 0)
                      }
                    }}
                  />
                  <span className={formData.category === "for sale" ? "font-medium" : "text-muted-foreground"}>
                    For Sale
                  </span>
                </div>
                <Badge variant={formData.category === "for sale" ? "default" : "secondary"}>
                  {formData.category === "for sale" ? "Sale" : "Rent"}
                </Badge>
              </div>

              {formData.category === "for sale" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="selling_price">
                      Selling Price (KSh) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="selling_price"
                      type="number"
                      min="0"
                      value={formData.selling_price || ""}
                      onChange={(e) => handleInputChange("selling_price", Number.parseFloat(e.target.value) || 0)}
                      placeholder="5000000"
                      className={errors.selling_price ? "border-red-500" : ""}
                    />
                    {errors.selling_price && <p className="text-sm text-red-500 mt-1">{errors.selling_price}</p>}
                  </div>

                  <div>
                    <Label htmlFor="viewing_fee">Viewing Fee (KSh)</Label>
                    <Input
                      id="viewing_fee"
                      type="number"
                      min="0"
                      value={formData.viewing_fee}
                      onChange={(e) => handleInputChange("viewing_fee", Number.parseFloat(e.target.value) || 0)}
                      placeholder="1000"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rent_amount">
                      Monthly Rent (KSh) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="rent_amount"
                      type="number"
                      min="0"
                      value={formData.rent_amount || ""}
                      onChange={(e) => handleInputChange("rent_amount", Number.parseFloat(e.target.value) || 0)}
                      placeholder="25000"
                      className={errors.rent_amount ? "border-red-500" : ""}
                    />
                    {errors.rent_amount && <p className="text-sm text-red-500 mt-1">{errors.rent_amount}</p>}
                  </div>

                  <div>
                    <Label htmlFor="deposit_amount">Security Deposit (KSh)</Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      min="0"
                      value={formData.deposit_amount || ""}
                      onChange={(e) => handleInputChange("deposit_amount", Number.parseFloat(e.target.value) || 0)}
                      placeholder="50000"
                      className={errors.deposit_amount ? "border-red-500" : ""}
                    />
                    {errors.deposit_amount && <p className="text-sm text-red-500 mt-1">{errors.deposit_amount}</p>}
                  </div>

                  <div>
                    <Label htmlFor="viewing_fee">Viewing Fee (KSh)</Label>
                    <Input
                      id="viewing_fee"
                      type="number"
                      min="0"
                      value={formData.viewing_fee}
                      onChange={(e) => handleInputChange("viewing_fee", Number.parseFloat(e.target.value) || 0)}
                      placeholder="500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">When will this unit be available?</h2>
              <p className="text-muted-foreground">Set the availability date and quantity</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <Label>
                  Available From <span className="text-red-500">*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                        errors.available_from && "border-red-500",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        if (date) {
                          handleInputChange("available_from", date.toISOString().split("T")[0])
                        }
                        setCalendarOpen(false)
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.available_from && <p className="text-sm text-red-500 mt-1">{errors.available_from}</p>}
              </div>

              <div>
                <Label htmlFor="frequency">
                  How many similar units are available? <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="frequency"
                  type="number"
                  min="1"
                  value={formData.frequency}
                  onChange={(e) => handleInputChange("frequency", Number.parseInt(e.target.value) || 1)}
                  placeholder="1"
                  className={errors.frequency ? "border-red-500" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If you have multiple identical units available, enter the total number here
                </p>
                {errors.frequency && <p className="text-sm text-red-500 mt-1">{errors.frequency}</p>}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Add photos of your property</h2>
              <p className="text-muted-foreground">High-quality images help attract more interest</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const files = e.dataTransfer.files
                    if (files.length > 0) {
                      handleImageUpload(files)
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <p className="text-lg font-medium text-gray-900 mb-2">Drop images here or click to upload</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  />
                </div>
              </div>

              {uploadProgress.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Uploading Images</h3>
                  {uploadProgress.map((upload, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{upload.file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadProgress(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={upload.progress} className="flex-1" />
                          <span className="text-xs text-muted-foreground">{upload.progress}%</span>
                        </div>
                        {upload.error && <p className="text-xs text-red-500 mt-1">{upload.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Uploaded Images ({formData.images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {index === 0 && <Badge className="absolute bottom-2 left-2">Main Photo</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">What features does this property have?</h2>
              <p className="text-muted-foreground">Select amenities and provide contact information</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <Label className="text-base font-medium">Select Available Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {AMENITIES.map((amenity) => (
                    <div
                      key={amenity}
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.amenities.includes(amenity)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {formData.amenities.includes(amenity) && <Check className="h-4 w-4" />}
                        <span className="text-sm font-medium">
                          {amenity.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Utilities Included</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {UTILITIES.map((utility) => (
                    <div
                      key={utility}
                      onClick={() => handleUtilityToggle(utility)}
                      className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.utilities_included.includes(utility)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {formData.utilities_included.includes(utility) && <Check className="h-4 w-4" />}
                        <span className="text-sm font-medium">
                          {utility.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet_policy">Pet Policy</Label>
                  <Select value={formData.pet_policy} onValueChange={(value) => handleInputChange("pet_policy", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PET_POLICIES.map((policy) => (
                        <SelectItem key={policy} value={policy}>
                          {policy.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="parking_available"
                      checked={formData.parking_available}
                      onCheckedChange={(checked) => handleInputChange("parking_available", checked)}
                    />
                    <Label htmlFor="parking_available">Parking Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => handleInputChange("featured", checked)}
                    />
                    <Label htmlFor="featured">Featured Listing</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="contact_info">
                  Contact Information <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange("contact_info", e.target.value)}
                  placeholder="Phone: +254 700 000 000&#10;Email: landlord@example.com&#10;WhatsApp: +254 700 000 000"
                  rows={3}
                  className={errors.contact_info ? "border-red-500" : ""}
                />
                {errors.contact_info && <p className="text-sm text-red-500 mt-1">{errors.contact_info}</p>}
              </div>
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Review your listing</h2>
              <p className="text-muted-foreground">Make sure everything looks correct before submitting</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Role:</strong> {formData.role}
                    </p>
                    <p>
                      <strong>Title:</strong> {formData.title}
                    </p>
                    <p>
                      <strong>Type:</strong> {formData.property_type}
                    </p>
                    <p>
                      <strong>Building:</strong> {formData.building_name}
                    </p>
                    <p>
                      <strong>Size:</strong> {formData.bedrooms} bed, {formData.bathrooms} bath, {formData.square_feet}{" "}
                      sq ft
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Address:</strong> {formData.address}
                      {formData.house_number && `, ${formData.house_number}`}
                    </p>
                    <p>
                      <strong>City:</strong> {formData.city}, {formData.state} {formData.zip_code}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Pricing</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Category:</strong> {formData.category}
                    </p>
                    {formData.category === "for sale" ? (
                      <p>
                        <strong>Price:</strong> KSh {(formData.selling_price || 0).toLocaleString()}
                      </p>
                    ) : (
                      <>
                        <p>
                          <strong>Rent:</strong> KSh {(formData.rent_amount || 0).toLocaleString()} / month
                        </p>
                        <p>
                          <strong>Deposit:</strong> KSh {(formData.deposit_amount || 0).toLocaleString()}
                        </p>
                      </>
                    )}
                    <p>
                      <strong>Available:</strong> {formData.available_from}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Features</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Images:</strong> {formData.images.length} uploaded
                    </p>
                    <p>
                      <strong>Amenities:</strong> {formData.amenities.length} selected
                    </p>
                    <p>
                      <strong>Utilities:</strong> {formData.utilities_included.length} included
                    </p>
                    <p>
                      <strong>Similar Units:</strong> {formData.frequency}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{formData.description}</p>
              </div>

              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add New Vacant Unit</h1>
          <p className="text-muted-foreground mt-2">Follow the steps to create your property listing</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((step) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    step.id === currentStep ? "text-primary font-medium" : ""
                  } ${step.id < currentStep ? "text-green-600" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      step.id < currentStep
                        ? "bg-green-600 text-white"
                        : step.id === currentStep
                          ? "bg-primary text-white"
                          : "bg-gray-200"
                    }`}
                  >
                    {step.id < currentStep ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="hidden sm:block text-center">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">{renderStepContent()}</CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep === STEPS.length ? (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Listing"}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
