"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Camera,
  CameraOff,
  Image as ImageIcon,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Zap,
  Plus,
  RefreshCw,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * Notes:
 * - The Google Places script will be loaded on the client.
 * - API key: this expects NEXT_PUBLIC_GOOGLE_MAPS_API or NEXT_GOOGLE_MAPS_API in environment.
 *   In Next.js only NEXT_PUBLIC_* is exposed to the browser, but we try both fallbacks.
 */

/* ---------------------------- Types ---------------------------- */

interface FormData {
  company_account_id: string | null
  user_id: string
  building_id: string
  building_name: string
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
  viewing_fee: number
  house_number: string
  frequency: number
  role: string
  available_from: string
  category: string
}

interface UploadProgress {
  file?: File
  progress: number
  url?: string | null
  error?: string
  status: "uploading" | "completed" | "error"
}

/* ---------------------------- Constants ---------------------------- */

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
  "wifi",
]

/* ---------------------------- Component ---------------------------- */

export default function NewVacantUnitPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [buildingsLoading, setBuildingsLoading] = useState(false)
  const [showOptionalDetails, setShowOptionalDetails] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userCompany, setUserCompany] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [cameraActive, setCameraActive] = useState<boolean>(true)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Google places input ref
  const locationInputRef = useRef<HTMLInputElement | null>(null)
  // keep track of autocomplete object to remove listeners if needed
  const autocompleteRef = useRef<any | null>(null)

  const [formData, setFormData] = useState<FormData>({
    company_account_id: null,
    user_id: "",
    building_id: "",
    building_name: "",
    title: "",
    description: "",
    property_type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 500,
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
    viewing_fee: 0,
    house_number: "undefined",
    frequency: 1,
    role: "agent",
    available_from: new Date().toISOString().split("T")[0],
    category: "rent",
  })

  /* ---------------------------- USER & BUILDINGS ---------------------------- */

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const currentUser = (data as any)?.user
        if (currentUser) {
          setUser(currentUser)
          // fetch phone & company
          const { data: userData, error } = await supabase
            .from("users")
            .select("company_account_id, phone")
            .eq("id", currentUser.id)
            .single()
          if (error) {
            console.warn("Could not load user profile", error)
          } else if (userData) {
            setUserCompany(userData.company_account_id || null)
            setFormData((prev) => ({
              ...prev,
              company_account_id: userData.company_account_id || null,
              user_id: currentUser.id,
              created_by: currentUser.id,
              contact_info: userData.phone || prev.contact_info,
            }))
          } else {
            // still set ids
            setFormData((prev) => ({ ...prev, user_id: currentUser.id, created_by: currentUser.id }))
          }
        }
      } catch (err) {
        console.error("getCurrentUser error", err)
      }
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    const fetchBuildings = async () => {
      if (!userCompany) return
      setBuildingsLoading(true)
      try {
        const { data, error } = await supabase
          .from("buildings")
          .select("*")
          .eq("status", "active")
          .eq("company_account_id", userCompany)
          .order("name")
        if (error) {
          console.error("Error fetching buildings:", error)
        } else {
          setBuildings(data || [])
        }
      } catch (err) {
        console.error("fetchBuildings error", err)
      } finally {
        setBuildingsLoading(false)
      }
    }
    fetchBuildings()
  }, [userCompany])

  /* ---------------------------- AUTO-OPEN GALLERY (optional) ---------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      // intentionally do NOT auto-click on desktop to avoid bad UX
      // if you do want auto-open for mobile, enable here
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  /* ---------------------------- LOCATION helpers & Google Places ---------------------------- */

  // Use navigator.geolocation as a fallback for current location (keeps latitude/longitude)
  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    if (!navigator.geolocation) {
      setIsGettingLocation(false)
      toast.error("Geolocation not supported")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setFormData((prev) => ({ ...prev, latitude, longitude }))
        // don't attempt reverse geocode here: we rely on places search for address
        setIsGettingLocation(false)
      },
      (err) => {
        console.warn("geolocation denied", err)
        setIsGettingLocation(false)
        toast.error("Location permission denied")
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // Load Google Places Autocomplete on client
  useEffect(() => {
    // skip on server
    if (typeof window === "undefined") return
    // if script already loaded, init
    const scriptId = "gmaps-places-script"

    const apiKey =
      (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API as string | undefined) ||
      (process.env.NEXT_GOOGLE_MAPS_API as string | undefined) ||
      (window as any).__NEXT_PUBLIC_GOOGLE_MAPS_API

    // If no key available, do nothing (user will provide key via env)
    if (!apiKey) {
      console.warn("Google Maps API key not found in NEXT_PUBLIC_GOOGLE_MAPS_API or NEXT_GOOGLE_MAPS_API")
      return
    }

    const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`

    const ensureAndInit = () => {
      if (!(window as any).google?.maps?.places) {
        // script not yet loaded
        const script = document.createElement("script")
        script.id = scriptId
        script.src = src
        script.async = true
        script.defer = true
        script.onload = () => {
          initAutocomplete()
        }
        document.body.appendChild(script)
      } else {
        initAutocomplete()
      }
    }

    function initAutocomplete() {
      const input = locationInputRef.current
      if (!input) return
      try {
        // If we already have an autocomplete instance, remove listener
        if (autocompleteRef.current) {
          try {
            // Can't remove listeners easily, we reassign new autocomplete
          } catch { }
        }
        const google = (window as any).google
        const autocomplete = new google.maps.places.Autocomplete(input, {
          types: ["geocode", "establishment"],
          fields: ["formatted_address", "address_components", "geometry", "name"],
        })
        autocompleteRef.current = autocomplete
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (!place) return
          const formatted = place.formatted_address || ""
          let city = ""
          let state = ""
          let postal = ""
          // parse components
          const comps = place.address_components || []
          comps.forEach((c: any) => {
            if (c.types.includes("postal_code")) postal = c.long_name
            if (c.types.includes("locality")) city = c.long_name
            if (c.types.includes("administrative_area_level_1")) state = c.long_name
            if (!city && c.types.includes("administrative_area_level_2")) {
              // sometimes city in level 2
              city = c.long_name
            }
          })
          const lat = place.geometry?.location?.lat ? place.geometry.location.lat() : formData.latitude
          const lng = place.geometry?.location?.lng ? place.geometry.location.lng() : formData.longitude

          setFormData((prev) => ({
            ...prev,
            address: formatted || prev.address,
            city: city || prev.city,
            state: state || prev.state,
            zip_code: postal || prev.zip_code,
            latitude: typeof lat === "function" ? lat() : lat,
            longitude: typeof lng === "function" ? lng() : lng,
          }))
        })
      } catch (err) {
        console.error("initAutocomplete error", err)
      }
    }

    ensureAndInit()

    // cleanup: remove script? we keep it for other pages. remove listener if necessary when component unmounts
    return () => {
      // no-op
    }
  }, [locationInputRef.current])

  /* ---------------------------- CAMERA lifecycle & capture ---------------------------- */

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        setFacingMode("user") // front by default on mobile
      } else {
        setFacingMode("environment")
      }
    }
  }, [])

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch { }
      }
      setCameraActive(true)
    } catch (err: any) {
      console.error("Camera start error:", err)
      setCameraError("Unable to access camera. Please allow permission.")
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    // start camera when facingMode changes
    startCamera(facingMode)
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !user?.id) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    // draw full frame
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
      handleImageUpload([file])
    }, "image/jpeg", 0.9)
  }

  /* ---------------------------- IMAGE UPLOAD ---------------------------- */

  const handleImageUpload = async (files: FileList | File[] | string[]) => {
    if (!user?.id) return
    let items: (File | string)[]
    if (files instanceof FileList) {
      items = Array.from(files)
    } else {
      items = files as (File | string)[]
    }
    if (items.length === 0) return

    const placeholders: UploadProgress[] = items.map(() => ({ progress: 0, status: "uploading" }))
    let startIndex = 0
    setUploadProgress((prev) => {
      startIndex = prev.length
      return [...prev, ...placeholders]
    })

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const uploadIndex = startIndex + i
      try {
        let file: File
        if (typeof item === "string") {
          const res = await fetch(item)
          const blob = await res.blob()
          const ext = (blob.type.split("/")[1] || "jpg").split("+")[0]
          file = new File([blob], `capture-${Date.now()}.${ext}`, { type: blob.type || "image/jpeg" })
        } else {
          file = item
        }

        const fileExt = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "")
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        let progressInterval: number | undefined
        progressInterval = window.setInterval(() => {
          setUploadProgress((prev) => {
            const copy = [...prev]
            const p = copy[uploadIndex]
            if (p && p.progress < 85) {
              copy[uploadIndex] = { ...p, progress: p.progress + 6 }
            }
            return copy
          })
        }, 300)

        const { data, error } = await supabase.storage.from("property-images").upload(fileName, file)
        if (progressInterval) clearInterval(progressInterval)
        if (error) throw error

        const { data: publicData } = supabase.storage.from("property-images").getPublicUrl(fileName)
        const publicUrl = (publicData as any)?.publicUrl || (data as any)?.path || null

        setUploadProgress((prev) => {
          const copy = [...prev]
          copy[uploadIndex] = { ...copy[uploadIndex], progress: 100, status: "completed", url: publicUrl }
          return copy
        })

        setFormData((prev) => ({ ...prev, images: [...prev.images, publicUrl] }))
      } catch (err: any) {
        console.error("Upload failed:", err)
        setUploadProgress((prev) => {
          const copy = [...prev]
          copy[uploadIndex] = { ...copy[uploadIndex], progress: 0, status: "error", error: err?.message || "Upload failed" }
          return copy
        })
      }
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  /* ---------------------------- FORM HELPERS ---------------------------- */

  const handleInputChange = (field: keyof FormData, value: any) => {
    // category autofill logic
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      // keep category logic: prefer explicit fill behavior
      if (field === "rent_amount") {
        if (value && Number(value) > 0) next.category = "rent"
        else if (!next.selling_price || Number(next.selling_price) <= 0) next.category = "rent"
      }
      if (field === "selling_price") {
        if (value && Number(value) > 0) next.category = "sale"
        else if (!next.rent_amount || Number(next.rent_amount) <= 0) next.category = "rent"
      }
      return next
    })
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // explicit toggle buttons near prices (set category)
  const setCategory = (cat: "rent" | "sale") => setFormData((prev) => ({ ...prev, category: cat }))

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleUtilityToggle = (utility: string) => {
    setFormData((prev) => ({
      ...prev,
      utilities_included: prev.utilities_included.includes(utility)
        ? prev.utilities_included.filter((u) => u !== utility)
        : [...prev.utilities_included, utility],
    }))
  }

  const validateQuickPost = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.rent_amount && !formData.selling_price) newErrors.price = "Enter rent or sale price"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /* ---------------------------- SUBMIT ---------------------------- */

  const handleQuickPost = async () => {
    if (!validateQuickPost()) return
    setLoading(true)
    try {
      const selectedBuilding = buildings.find((b) => b.building_id === formData.building_id)
      const sanitizedData = {
        user_id: user?.id || null,
        created_by: user?.id || null,
        company_account_id: userCompany,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        square_feet: formData.square_feet || null,
        rent_amount: formData.rent_amount || 0,
        selling_price: formData.selling_price || 0,
        deposit_amount: formData.deposit_amount || null,
        viewing_fee: formData.viewing_fee || null,
        address: formData.address.trim() || "",
        city: formData.city.trim() || "",
        state: formData.state.trim() || "",
        zip_code: formData.zip_code.trim() || "",
        house_number: formData.house_number || "undefined",
        building_id: formData.building_id || null,
        building_name: selectedBuilding?.name || formData.building_name || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        amenities: formData.amenities,
        pet_policy: formData.pet_policy,
        parking_available: formData.parking_available,
        utilities_included: formData.utilities_included,
        images: formData.images,
        virtual_tour_url: formData.virtual_tour_url.trim() || null,
        status: formData.status,
        featured: formData.featured,
        contact_info: formData.contact_info.trim() || null,
        frequency: formData.frequency || null,
        role: formData.role || null,
        available_from: formData.available_from || null,
        category: formData.category || "not mentioned",
      }

      const { data, error } = await supabase.from("vacant_units").insert([sanitizedData]).select().single()
      if (error) {
        console.error("Insert error:", error)
        setErrors({ general: error.message || "Failed to create unit" })
        setLoading(false)
        return
      }
      stopCamera()
      toast.success("Unit posted successfully!")
      router.push("/vacant-units")
    } catch (err: any) {
      console.error("handleQuickPost error", err)
      setErrors({ general: err?.message || "Failed to create unit" })
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------- Render ---------------------------- */

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

  return (
    <div className="container mx-auto py-4 px-4 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Post Unit</h1>
        <Zap className="h-6 w-6 text-primary" />
      </div>

      {/* Camera / Upload Card */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-0">
          {cameraActive ? (
            <div className="relative w-full h-[60vh] bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {/* Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                <button
                  aria-label="Flip camera"
                  onClick={() => setFacingMode((p) => (p === "user" ? "environment" : "user"))}
                  className="bg-black/40 p-3 rounded-full"
                  type="button"
                >
                  <RefreshCw className="h-6 w-6 text-white" />
                </button>

                <button
                  aria-label="Capture"
                  onClick={capturePhoto}
                  className="bg-primary p-4 rounded-full shadow-lg flex items-center justify-center"
                  type="button"
                >
                  <Camera className="h-7 w-7 text-white" />
                </button>

                <button
                  aria-label="Choose from gallery"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black/40 p-3 rounded-full"
                  type="button"
                >
                  <ImageIcon className="h-6 w-6 text-white" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                />
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <CameraOff className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-500">{cameraError || "Camera is off"}</p>
              <div className="flex space-x-2">
                <Button onClick={() => startCamera(facingMode)}>Enable Camera</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Choose from Gallery
                </Button>
              </div>
            </div>
          )}

          {/* Thumbnails */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 p-4">
              {formData.images.slice(0, 6).map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url || "/placeholder.svg"} alt={`Property ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {idx === 0 && <Badge className="absolute bottom-1 left-1 text-xs">Main</Badge>}
                </div>
              ))}
              {formData.images.length > 6 && (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg h-20">
                  <span className="text-sm text-gray-600">+{formData.images.length - 6}</span>
                </div>
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-2 p-4">
              {uploadProgress.map((u, i) => (
                <div key={i} className="flex items-center space-x-2 text-sm">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${u.progress}%`, background: "var(--primary)" }} />
                  </div>
                  <span className="text-xs">{u.progress}%</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Title / Price / Location (priority) */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          {/* Title */}
          <div>
            <Input
              placeholder="e.g., Spacious 2BR in Westlands"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={cn("text-lg", errors.title && "border-red-500")}
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Price inputs + category toggle */}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Label className="text-sm">For Rent (KSh)</Label>
              <Input
                type="number"
                placeholder="Monthly rent"
                value={formData.rent_amount || ""}
                onChange={(e) => handleInputChange("rent_amount", Number.parseFloat(e.target.value) || 0)}
                className={errors.price ? "border-red-500" : ""}
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm">For Sale (KSh)</Label>
              <Input
                type="number"
                placeholder="Sale price"
                value={formData.selling_price || ""}
                onChange={(e) => handleInputChange("selling_price", Number.parseFloat(e.target.value) || 0)}
                className={errors.price ? "border-red-500" : ""}
              />
            </div>
          </div>
          {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}

          {/* Category toggle (explicit) */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={formData.category === "rent" ? "default" : "ghost"}
              onClick={() => setCategory("rent")}
            >
              Rent
            </Button>
            <Button
              size="sm"
              variant={formData.category === "sale" ? "default" : "ghost"}
              onClick={() => setCategory("sale")}
            >
              Sale
            </Button>
            <span className="text-sm text-muted-foreground ml-2">Category: {formData.category}</span>
          </div>

          {/* Location / Google places */}
          <div>
            <Label className="text-sm">Location</Label>
            <Input
              id="location-input"
              ref={locationInputRef}
              placeholder="Search location (Google Places)..."
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
            <div className="mt-2">
              <Button variant="ghost" size="sm" onClick={getCurrentLocation} disabled={isGettingLocation} className="p-0 h-auto text-primary">
                <MapPin className="mr-2 h-4 w-4" />
                {isGettingLocation ? "Getting location..." : "Use Current Location"}
              </Button>
            </div>
          </div>

          {/* viewing_fee (priority: after description requested — but putting here for visibility) */}
          {/* If you prefer exactly after the description input in another card, move this block there. */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Viewing Fee (KSh)</Label>
              <Input
                type="number"
                placeholder="Viewing fee"
                value={formData.viewing_fee || ""}
                onChange={(e) => handleInputChange("viewing_fee", Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-sm">Deposit (KSh)</Label>
              <Input
                type="number"
                placeholder="Deposit amount"
                value={formData.deposit_amount || ""}
                onChange={(e) => handleInputChange("deposit_amount", Number.parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post button */}
      <Button
        onClick={handleQuickPost}
        disabled={loading}
        size="lg"
        className="w-full mb-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        {loading ? "Posting..." : "Post Now"}
        <Zap className="ml-2 h-4 w-4" />
      </Button>

      {/* Collapsible: more details */}
      <Collapsible open={showOptionalDetails} onOpenChange={setShowOptionalDetails}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Add More Details
            {showOptionalDetails ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-4">
          {/* Building select */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium mb-2 block">Building</Label>
              <Select
                value={formData.building_id || ""}
                onValueChange={(value) => {
                  handleInputChange("building_id", value)
                  const selected = buildings.find((b) => b.building_id === value)
                  if (selected) {
                    handleInputChange("building_name", selected.name)
                    handleInputChange("address", selected.address || "")
                    handleInputChange("city", selected.city || "")
                    handleInputChange("state", selected.state || "")
                    handleInputChange("zip_code", selected.zip_code || "")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={buildingsLoading ? "Loading..." : "Select building"} />
                </SelectTrigger>
                <SelectContent>
                  {buildingsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading buildings...
                    </SelectItem>
                  ) : buildings.length === 0 ? (
                    <SelectItem value="no-buildings" disabled>
                      No buildings available
                    </SelectItem>
                  ) : (
                    buildings.map((b: any) => (
                      <SelectItem key={b.building_id} value={b.building_id}>
                        {b.name} - {b.address}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Property details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(v) => handleInputChange("property_type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Bedrooms</Label>
                  <Input type="number" min={0} value={formData.bedrooms} onChange={(e) => handleInputChange("bedrooms", Number.parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Bathrooms</Label>
                  <Input type="number" min={0} step="0.5" value={formData.bathrooms} onChange={(e) => handleInputChange("bathrooms", Number.parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-sm">Square Feet</Label>
                  <Input type="number" min={1} value={formData.square_feet} onChange={(e) => handleInputChange("square_feet", Number.parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div>
                <Label className="text-sm">Description</Label>
                <Textarea placeholder="Describe the property features..." value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} />
                {/* If you prefer viewing_fee specifically after description, you can un-comment/move below */}
                {/* <div className="mt-3">
                  <Label className="text-sm">Viewing Fee</Label>
                  <Input type="number" value={formData.viewing_fee || ""} onChange={(e) => handleInputChange("viewing_fee", Number.parseFloat(e.target.value) || 0)} />
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium mb-3 block">Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.slice(0, 8).map((amenity) => (
                  <div
                    key={amenity}
                    onClick={() => handleAmenityToggle(amenity)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-xs",
                      formData.amenities.includes(amenity) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-gray-50 border-gray-200",
                    )}
                  >
                    {formData.amenities.includes(amenity) && <Check className="h-3 w-3 mr-1" />}
                    {amenity.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium mb-2 block">Contact Info</Label>
              <Textarea placeholder="Phone: +254 700 000 000" value={formData.contact_info} onChange={(e) => handleInputChange("contact_info", e.target.value)} rows={2} />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {errors.general && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
