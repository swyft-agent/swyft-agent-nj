"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react"

interface AddTenantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTenant: (tenant: any) => void
}

export function AddTenantModal({ open, onOpenChange, onAddTenant }: AddTenantModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    building: "",
    unit: "",
    moveInDate: "",
    leaseEnd: "",
  })

  const buildings = [
    "Skyline Apartments",
    "Parkview Heights",
    "Riverside Condos",
    "Downtown Lofts",
    "Harbor View Suites",
    "Oakwood Residences",
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newTenant = {
      id: Date.now(),
      name: formData.name,
      unit: formData.unit,
      building: formData.building,
      phone: formData.phone,
      email: formData.email,
      moveInDate: formData.moveInDate,
      leaseEnd: formData.leaseEnd,
      status: "active",
      rentStatus: "current",
    }

    onAddTenant(newTenant)
    onOpenChange(false)

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      building: "",
      unit: "",
      moveInDate: "",
      leaseEnd: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>Enter the tenant's information to add them to your system.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="John Smith"
                className="pl-8"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@email.com"
                  className="pl-8"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  className="pl-8"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building">Building *</Label>
              <Select value={formData.building} onValueChange={(value) => handleInputChange("building", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building} value={building}>
                      {building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit Number *</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moveInDate">Move-in Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="moveInDate"
                  type="date"
                  className="pl-8"
                  value={formData.moveInDate}
                  onChange={(e) => handleInputChange("moveInDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="leaseEnd"
                  type="date"
                  className="pl-8"
                  value={formData.leaseEnd}
                  onChange={(e) => handleInputChange("leaseEnd", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Tenant</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
