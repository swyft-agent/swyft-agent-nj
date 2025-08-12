"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Upload, X } from "lucide-react"

export default function NewListingPage() {
  const [images, setImages] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map((file) => URL.createObjectURL(file))
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6">Add New Listing</h1>

          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Building Name</Label>
              <Input id="name" placeholder="Enter building name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="location" placeholder="Search for address" className="pl-8" />
              </div>

              {/* Map Preview */}
              <div className="mt-2 h-[200px] w-full bg-muted rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Map Preview</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units">Number of Units</Label>
                <Input id="units" type="number" placeholder="Enter number of units" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Property Type</Label>
                <Input id="type" placeholder="Apartment, Condo, etc." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter property description" rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative h-24 rounded-md overflow-hidden">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Property ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/20 bg-muted/50 hover:bg-muted/80 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  <Input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline">Cancel</Button>
              <Button>Create Listing</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
