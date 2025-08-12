import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's company account ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_account_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData?.company_account_id) {
      return NextResponse.json({ error: "Company account not found" }, { status: 404 })
    }

    // Fetch ads for the company
    const { data: adsData, error: adsError } = await supabase
      .from("ads")
      .select("*")
      .eq("company_account_id", userData.company_account_id)
      .order("created_at", { ascending: false })

    if (adsError) {
      console.error("Ads fetch error:", adsError)
      return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 })
    }

    // Fetch related vacant units if we have ads
    let enrichedAds = []

    if (adsData && adsData.length > 0) {
      const propertyIds = [...new Set(adsData.map((ad) => ad.property_id).filter(Boolean))]

      let vacantUnitsData: any[] = []
      if (propertyIds.length > 0) {
        const { data: unitsData, error: unitsError } = await supabase
          .from("vacant_units")
          .select("id, title, address, city")
          .in("id", propertyIds)

        if (!unitsError) {
          vacantUnitsData = unitsData || []
        }
      }

      // Combine ads with property information
      enrichedAds = adsData.map((ad) => {
        const property = vacantUnitsData.find((unit) => unit.id === ad.property_id)
        return {
          ...ad,
          property_title: property?.title || "Unknown Property",
          property_address: property?.address || "Unknown Address",
          property_city: property?.city || "Unknown City",
        }
      })
    }

    return NextResponse.json({ ads: enrichedAds })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's company account ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_account_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData?.company_account_id) {
      return NextResponse.json({ error: "Company account not found" }, { status: 404 })
    }

    // Create the ad
    const { data, error } = await supabase
      .from("ads")
      .insert({
        ...body,
        company_account_id: userData.company_account_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Ad creation error:", error)
      return NextResponse.json({ error: "Failed to create ad" }, { status: 500 })
    }

    return NextResponse.json({ ad: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
