"use client"

import { useEffect, useRef } from "react"
import { MapPin, Navigation } from "lucide-react"

interface RouteMapProps {
  pickupLocation: string
  dropoffLocation: string
}

export function RouteMap({ pickupLocation, dropoffLocation }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // In a real app, you would initialize a map here (Google Maps, Mapbox, etc.)
    // For now, we'll show a placeholder with route visualization
  }, [pickupLocation, dropoffLocation])

  const hasLocations = pickupLocation && dropoffLocation

  return (
    <div className="h-[300px] sm:h-[400px] w-full bg-muted rounded-lg relative overflow-hidden">
      {hasLocations ? (
        <div className="relative h-full w-full bg-gradient-to-br from-blue-50 to-green-50">
          {/* Simulated map background */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-gray-200"></div>
              ))}
            </div>
          </div>

          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D46A" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0066CC" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 60 80 Q 150 120 240 160 T 340 200"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray="8,4"
              className="animate-pulse"
            />
          </svg>

          {/* Pickup marker */}
          <div className="absolute top-16 left-12 flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-lg border-2 border-primary">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
            <span className="text-xs font-medium">Pickup</span>
          </div>

          {/* Dropoff marker */}
          <div className="absolute bottom-16 right-12 flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-lg border-2 border-red-500">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-medium">Drop-off</span>
          </div>

          {/* Distance and time info */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-primary" />
              <div>
                <div className="font-semibold">12.5 km</div>
                <div className="text-xs text-muted-foreground">~25 mins</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Map will show route when locations are entered</p>
          </div>
        </div>
      )}
    </div>
  )
}
