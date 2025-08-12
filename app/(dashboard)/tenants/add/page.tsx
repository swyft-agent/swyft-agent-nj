"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon, Plus, Loader2 } from 'lucide-react'
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { ImageUploadManager } from "@/lib/image-upload" // Corrected import

interface Building {
  building_id: string
  name: string
}

interface Unit {
  id: string
  unit_number: string
  building_id: string
}

const AddTenantLoading = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-10 w-10 animate-spin" />
  </div>
)

export default function AddTenantPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("")
  const [unitNumber, setUnitNumber] = useState("") // Changed to text field
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(undefined)
  const [moveOutDate, setMoveOutDate] = useState<Date | undefined>(undefined)
  const [monthlyRent, setMonthlyRent] = useState("")
  const [arrears, setArrears] = useState("")
  const [occupancyStatus, setOccupancyStatus] = useState("occupied")
  const [leaseTerms, setLeaseTerms] = useState("")
  const [rentStatus, setRentStatus] = useState("current")
  const [status, setStatus] = useState("active")

  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLeasePreview, setShowLeasePreview] = useState(false)

  useEffect(() => {
    async function loadBuildings() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error("User not authenticated.")
        }

        const { data: userData, error: userProfileError } = await supabase
          .from("users")
          .select("company_account_id")
          .eq("id", user.id)
          .single()

        if (userProfileError || !userData?.company_account_id) {
          throw new Error("Could not determine your company. Please try again or contact support.")
        }

        const companyAccountId = userData.company_account_id

        const { data, error } = await supabase
          .from("buildings")
          .select("building_id, name")
          .eq("company_account_id", companyAccountId)

        if (error) {
          throw error
        }
        setBuildings(data || [])
      } catch (error: any) {
        console.error("Error loading buildings:", error.message)
        toast.error(`Error loading buildings: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    loadBuildings()
  }, [])

  const selectedBuildingName = useMemo(() => {
    return buildings.find((b) => b.building_id === selectedBuildingId)?.name || ""
  }, [selectedBuildingId, buildings])

  const generateLeaseContent = () => {
    return `
    --- Lease Agreement ---

    Tenant Details:
    Name: ${name}
    Email: ${email}
    Phone: ${phone}

    Property Details:
    Building: ${selectedBuildingName || "N/A_Building"}
    Unit: ${unitNumber}
    Occupancy Status: ${occupancyStatus}

    Lease Period:
    Move-in Date: ${moveInDate ? format(moveInDate, "PPP") : "N/A"}
    Move-out Date: ${moveOutDate ? format(moveOutDate, "PPP") : "N/A"}

    Financials:
    Monthly Rent: KES ${monthlyRent}
    Arrears: KES ${arrears || "0"}
    Rent Status: ${rentStatus}

    Lease Terms:
    ${leaseTerms || "No specific terms provided."}

    --- End of Agreement ---
    `
  }

  const handleLeaseDownload = () => {
    const content = generateLeaseContent()
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lease Agreement - ${name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              margin: 40px; 
              color: #333;
            }
            h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #555; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <h1>Lease Agreement</h1>
          <pre>${content}</pre>
        </body>
        </html>
      `)
      printWindow.document.close()
      
      // Trigger print dialog which allows saving as PDF
      printWindow.focus()
      printWindow.print()
      
      // Close the window after a delay
      setTimeout(() => {
        printWindow.close()
      }, 1000)
    }
  }

  const handleLeaseUpload = async () => {
    setIsSubmitting(true)
    try {
      const content = generateLeaseContent()
      const fileName = `lease_agreements/${name.replace(/\s/g, "_")}_${Date.now()}.pdf`
      
      // Create HTML content for PDF generation
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lease Agreement - ${name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              margin: 40px; 
              color: #333;
            }
            h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <h1>Lease Agreement</h1>
          <pre>${content}</pre>
        </body>
        </html>
      `
      
      const file = new File([htmlContent], fileName, { type: "text/html" })

      const { url, error: uploadError } = await ImageUploadManager.uploadFile(
        "documents", // Your bucket name
        fileName,
        file,
      )

      if (uploadError) {
        throw uploadError
      }

      return url // Return the public URL to be saved in DB
    } catch (error: any) {
      console.error("Error uploading lease agreement:", error.message)
      toast.error(`Error uploading lease agreement: ${error.message}`)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!name || !email || !phone || !selectedBuildingId || !moveInDate || !monthlyRent) {
      toast.error("Please fill in all required fields.")
      setIsSubmitting(false)
      return
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("User not authenticated.")
      }

      const { data: userData, error: userProfileError } = await supabase
        .from("users")
        .select("company_account_id")
        .eq("id", user.id)
        .single()

      if (userProfileError || !userData?.company_account_id) {
        throw new Error("Could not determine your company. Please try again or contact support.")
      }

      const companyAccountId = userData.company_account_id

      let leaseAgreementUrl: string | null = null
      if (leaseTerms) {
        leaseAgreementUrl = await handleLeaseUpload()
        if (!leaseAgreementUrl) {
          // If upload failed, but lease terms were provided, we might want to prevent submission
          // or just log a warning and proceed without the URL.
          // For now, I'll let it proceed but you might want to change this behavior.
          console.warn("Lease agreement upload failed, proceeding without URL.")
        }
      }

      const { data, error } = await supabase.from("tenants").insert([
        {
          user_id: user.id,
          company_account_id: companyAccountId,
          name,
          email,
          phone,
          building_id: selectedBuildingId || null, // Store building_id
          unit: unitNumber, // Store unit as text
          move_in_date: moveInDate.toISOString().split("T")[0],
          move_out_date: moveOutDate ? moveOutDate.toISOString().split("T")[0] : null,
          monthly_rent: Number.parseFloat(monthlyRent),
          arrears: arrears ? Number.parseFloat(arrears) : 0,
          occupancy_status: occupancyStatus,
          rent_status: rentStatus,
          status: status,
          lease_agreement_url: leaseAgreementUrl,
        },
      ])

      if (error) {
        throw error
      }

      toast.success("Tenant added successfully!")
      router.push("/tenants")
    } catch (error: any) {
      console.error("Error adding tenant:", error.message)
      toast.error(`Error adding tenant: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <AddTenantLoading />
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Tenant</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tenant Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tenant Details</h2>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Property Details</h2>
            <div>
              <Label htmlFor="building">Building</Label>
              <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.building_id} value={building.building_id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Unit Number (e.g., A101, Apt 2)</Label>
              <Input
                id="unit"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="Enter unit number"
              />
            </div>
            <div>
              <Label htmlFor="occupancyStatus">Occupancy Status</Label>
              <Select value={occupancyStatus} onValueChange={setOccupancyStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select occupancy status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lease & Financial Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Lease & Financial Details</h2>
            <div>
              <Label htmlFor="moveInDate">Move-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !moveInDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {moveInDate ? format(moveInDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={moveInDate} onSelect={setMoveInDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="moveOutDate">Move-out Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !moveOutDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {moveOutDate ? format(moveOutDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={moveOutDate} onSelect={setMoveOutDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="monthlyRent">Monthly Rent (KES)</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="arrears">Arrears (KES) (Optional)</Label>
              <Input id="arrears" type="number" value={arrears} onChange={(e) => setArrears(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="rentStatus">Rent Status</Label>
              <Select value={rentStatus} onValueChange={setRentStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select rent status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Tenant Status</Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="moving-out">Moving Out</SelectItem>
                  <SelectItem value="moved-out">Moved Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lease Agreement */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Lease Agreement</h2>
            <div>
              <Label htmlFor="leaseTerms">Lease Terms</Label>
              <Textarea
                id="leaseTerms"
                value={leaseTerms}
                onChange={(e) => setLeaseTerms(e.target.value)}
                placeholder="Enter lease terms and conditions here..."
                rows={8}
              />
            </div>
            <Button type="button" onClick={() => setShowLeasePreview(true)} className="w-full">
              Preview Lease Agreement
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Tenant...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Lease Preview Dialog */}
      <Dialog open={showLeasePreview} onOpenChange={setShowLeasePreview}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Lease Agreement Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/50">
            <pre className="whitespace-pre-wrap font-mono text-sm">{generateLeaseContent()}</pre>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" onClick={handleLeaseDownload}>
              Download Lease
            </Button>
            <Button type="button" onClick={() => setShowLeasePreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
