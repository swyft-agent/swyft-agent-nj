"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, MousePointer, TrendingUp, Pause, Play, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

interface Ad {
  id: string
  title: string
  description: string
  property_id: string
  budget: number
  status: "active" | "paused" | "completed" | "expired"
  clicks: number
  impressions: number
  conversions: number
  expires_at: string
  created_at: string
  user_id: string
  company_account_id?: string
  vacant_unit?: {
    title: string
    address: string
    location: string
  }
}

export default function AdsPage() {
  const { user } = useAuth()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchAds()
    }
  }, [user?.id])

  const fetchAds = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      // Get user's company account if they have one
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_account_id")
        .eq("id", user.id)
        .single()

      if (userError && userError.code !== "PGRST116") {
        console.warn("User data fetch warning:", userError)
      }

      const companyId = userData?.company_account_id

      // Fetch ads for the user (company or individual)
      let adsQuery = supabase.from("ads").select("*").order("created_at", { ascending: false })

      if (companyId) {
        adsQuery = adsQuery.eq("company_account_id", companyId)
      } else {
        adsQuery = adsQuery.eq("user_id", user.id)
      }

      const { data: adsData, error: adsError } = await adsQuery

      if (adsError) {
        console.error("Ads fetch error:", adsError)
        throw new Error(`Failed to fetch ads: ${adsError.message}`)
      }

      // Fetch vacant units separately to get property details
      let vacantUnitsQuery = supabase.from("vacant_units").select("id, title, address, location")

      if (companyId) {
        vacantUnitsQuery = vacantUnitsQuery.eq("company_account_id", companyId)
      } else {
        vacantUnitsQuery = vacantUnitsQuery.eq("user_id", user.id)
      }

      const { data: vacantUnitsData, error: vacantUnitsError } = await vacantUnitsQuery

      if (vacantUnitsError) {
        console.warn("Failed to fetch vacant units:", vacantUnitsError.message)
      }

      // Ensure data is always an array
      const safeAdsData = Array.isArray(adsData) ? adsData : []
      const safeVacantUnitsData = Array.isArray(vacantUnitsData) ? vacantUnitsData : []

      // Combine ads with vacant unit data
      const adsWithUnits = safeAdsData.map((ad) => ({
        ...ad,
        vacant_unit: safeVacantUnitsData.find((unit) => unit.id === ad.property_id),
      }))

      setAds(adsWithUnits)
    } catch (err) {
      console.error("Error fetching ads:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch ads")
      // Set empty array on error to prevent undefined issues
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  const toggleAdStatus = async (adId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active"

      const { error } = await supabase.from("ads").update({ status: newStatus }).eq("id", adId)

      if (error) {
        throw new Error(`Failed to update ad status: ${error.message}`)
      }

      // Update local state
      setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, status: newStatus as "active" | "paused" } : ad)))
      toast.success(`Ad ${newStatus === "active" ? "activated" : "paused"} successfully`)
    } catch (err) {
      console.error("Error updating ad status:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update ad status")
    }
  }

  const deleteAd = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return

    try {
      const { error } = await supabase.from("ads").delete().eq("id", adId)

      if (error) {
        throw new Error(`Failed to delete ad: ${error.message}`)
      }

      // Update local state
      setAds((prev) => prev.filter((ad) => ad.id !== adId))
      toast.success("Ad deleted successfully")
    } catch (err) {
      console.error("Error deleting ad:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete ad")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0.0%"
    return ((clicks / impressions) * 100).toFixed(1) + "%"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  // Ensure ads is always an array
  const safeAds = Array.isArray(ads) ? ads : []

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ads</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Ad
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ads</h1>
          <p className="text-muted-foreground">Manage your property advertising campaigns</p>
        </div>
        <Link href="/ads/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Ad
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={fetchAds} className="ml-2 bg-transparent">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeAds.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {safeAds.filter((ad) => ad.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeAds.reduce((sum, ad) => sum + (ad.clicks || 0), 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(safeAds.reduce((sum, ad) => sum + (Number(ad.budget) || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ads List */}
      {safeAds.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No ads yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first ad campaign to start promoting your vacant units
            </p>
            <Link href="/ads/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ad
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {safeAds.map((ad) => (
            <Card key={ad.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{ad.title}</CardTitle>
                    <CardDescription>
                      {ad.vacant_unit
                        ? `${ad.vacant_unit.title} - ${ad.vacant_unit.address || ad.vacant_unit.location}`
                        : "Property details not available"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(ad.status)}>{ad.status}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleAdStatus(ad.id, ad.status)}>
                        {ad.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAd(ad.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{ad.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <Eye className="h-3 w-3" />
                      Impressions
                    </div>
                    <div className="text-lg font-semibold">{(ad.impressions || 0).toLocaleString()}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <MousePointer className="h-3 w-3" />
                      Clicks
                    </div>
                    <div className="text-lg font-semibold">{(ad.clicks || 0).toLocaleString()}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">CTR</div>
                    <div className="text-lg font-semibold">{calculateCTR(ad.clicks || 0, ad.impressions || 0)}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Budget</div>
                    <div className="text-lg font-semibold">{formatCurrency(Number(ad.budget) || 0)}</div>
                  </div>
                </div>

                {ad.expires_at && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Expires: {new Date(ad.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
