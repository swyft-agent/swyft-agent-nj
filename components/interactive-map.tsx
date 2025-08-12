"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface MapLocation {
  coords: [number, number]
  label: string
  type: "pickup" | "dropoff"
}

interface InteractiveMapProps {
  locations: MapLocation[]
  className?: string
  showRoute?: boolean
}

export function InteractiveMap({ locations, className = "", showRoute = false }: InteractiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([-1.2921, 36.8219]) // Nairobi center
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState<[number, number]>([0, 0])
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 })

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = useCallback(
    (lat: number, lng: number): [number, number] => {
      const centerLat = center[0]
      const centerLng = center[1]

      // Simple mercator-like projection
      const scale = zoom * 10000
      const x = (lng - centerLng) * scale + canvasSize.width / 2
      const y = -(lat - centerLat) * scale + canvasSize.height / 2

      return [x, y]
    },
    [center, zoom, canvasSize],
  )

  // Convert canvas coordinates to lat/lng
  const canvasToLatLng = useCallback(
    (x: number, y: number): [number, number] => {
      const centerLat = center[0]
      const centerLng = center[1]

      const scale = zoom * 10000
      const lng = (x - canvasSize.width / 2) / scale + centerLng
      const lat = -(y - canvasSize.height / 2) / scale + centerLat

      return [lat, lng]
    },
    [center, zoom, canvasSize],
  )

  // Draw the map
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#f8f9fa"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid pattern to simulate map tiles
    ctx.strokeStyle = "#e9ecef"
    ctx.lineWidth = 1
    const gridSize = 50 * zoom

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw some simulated roads
    ctx.strokeStyle = "#dee2e6"
    ctx.lineWidth = 2
    const roadSpacing = 100 * zoom

    for (let x = roadSpacing; x < canvas.width; x += roadSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = roadSpacing; y < canvas.height; y += roadSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw route if requested and we have both locations
    if (showRoute && locations.length >= 2) {
      const pickup = locations.find((loc) => loc.type === "pickup")
      const dropoff = locations.find((loc) => loc.type === "dropoff")

      if (pickup && dropoff) {
        const [x1, y1] = latLngToCanvas(pickup.coords[0], pickup.coords[1])
        const [x2, y2] = latLngToCanvas(dropoff.coords[0], dropoff.coords[1])

        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 4
        ctx.setLineDash([10, 5])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Draw location markers
    locations.forEach((location) => {
      const [x, y] = latLngToCanvas(location.coords[0], location.coords[1])

      // Draw marker circle
      ctx.fillStyle = location.type === "pickup" ? "#10b981" : "#ef4444"
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, 2 * Math.PI)
      ctx.fill()

      // Draw white border
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw label
      ctx.fillStyle = "#1f2937"
      ctx.font = "12px system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(location.label, x, y - 20)
    })

    // Draw center crosshair
    ctx.strokeStyle = "#6b7280"
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    ctx.beginPath()
    ctx.moveTo(centerX - 10, centerY)
    ctx.lineTo(centerX + 10, centerY)
    ctx.moveTo(centerX, centerY - 10)
    ctx.lineTo(centerX, centerY + 10)
    ctx.stroke()
    ctx.setLineDash([])
  }, [locations, showRoute, latLngToCanvas, zoom, canvasSize])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      setCanvasSize({ width: rect.width, height: rect.height })
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // Redraw when dependencies change
  useEffect(() => {
    drawMap()
  }, [drawMap])

  // Auto-fit to show all locations
  const fitToLocations = useCallback(() => {
    if (locations.length === 0) return

    if (locations.length === 1) {
      setCenter([locations[0].coords[0], locations[0].coords[1]])
      setZoom(2)
      return
    }

    // Calculate bounds
    const lats = locations.map((loc) => loc.coords[0])
    const lngs = locations.map((loc) => loc.coords[1])

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    // Set center to middle of bounds
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    setCenter([centerLat, centerLng])

    // Calculate zoom to fit all points
    const latRange = maxLat - minLat
    const lngRange = maxLng - minLng
    const maxRange = Math.max(latRange, lngRange)

    if (maxRange > 0) {
      const newZoom = Math.min(3, 0.5 / maxRange)
      setZoom(Math.max(0.5, newZoom))
    }
  }, [locations])

  // Auto-fit when locations change
  useEffect(() => {
    if (locations.length > 0) {
      fitToLocations()
    }
  }, [locations, fitToLocations])

  // Touch and mouse event handlers
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setLastMousePos([clientX, clientY])
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return

    const deltaX = clientX - lastMousePos[0]
    const deltaY = clientY - lastMousePos[1]

    const scale = zoom * 10000
    const latDelta = deltaY / scale
    const lngDelta = -deltaX / scale

    setCenter((prev) => [prev[0] + latDelta, prev[1] + lngDelta])
    setLastMousePos([clientX, clientY])
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault()
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleEnd()
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.5, 10))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.5, 0.1))
  }

  return (
    <div className={`relative border rounded-lg overflow-hidden bg-gray-50 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move touch-none"
        style={{ display: "block" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Map Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Button size="sm" variant="secondary" className="h-8 w-8 p-0 mobile-button" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" className="h-8 w-8 p-0 mobile-button" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" className="h-8 w-8 p-0 mobile-button" onClick={fitToLocations}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Info */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600">
        <div>Zoom: {zoom.toFixed(1)}x</div>
        <div>
          Center: {center[0].toFixed(4)}, {center[1].toFixed(4)}
        </div>
      </div>

      {/* Legend */}
      {locations.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
          {locations.map((location, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${location.type === "pickup" ? "bg-green-500" : "bg-red-500"}`} />
              <span>{location.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
