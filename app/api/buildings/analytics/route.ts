import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const serverClient = createServerClient()

    // Get user session to get company_account_id
    const { data: sessionData } = await serverClient.auth.getSession()
    if (!sessionData?.session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's company_account_id
    const { data: userData, error: userError } = await serverClient
      .from("users")
      .select("company_account_id")
      .eq("id", sessionData.session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get buildings data
    const { data: buildings, error: buildingsError } = await serverClient
      .from("buildings")
      .select("id, name, building_income, total_units")
      .eq("company_account_id", userData.company_account_id)

    if (buildingsError) {
      return NextResponse.json({ error: buildingsError.message }, { status: 500 })
    }

    // Get tenants data
    const { data: tenants, error: tenantsError } = await serverClient
      .from("tenants")
      .select("id, building_id, rent_status, monthly_rent, arrears")
      .eq("company_account_id", userData.company_account_id)

    if (tenantsError) {
      return NextResponse.json({ error: tenantsError.message }, { status: 500 })
    }

    // Calculate analytics
    const totalExpected = buildings?.reduce((sum, building) => sum + (building.building_income || 0), 0) || 0

    const totalCollected =
      tenants
        ?.filter((tenant) => tenant.rent_status === "paid")
        .reduce((sum, tenant) => sum + (tenant.monthly_rent || 0), 0) || 0

    const rentCollectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

    // Calculate arrears per building
    const buildingArrears = new Map()
    tenants?.forEach((tenant) => {
      if (tenant.building_id && tenant.arrears) {
        const currentArrears = buildingArrears.get(tenant.building_id) || 0
        buildingArrears.set(tenant.building_id, currentArrears + tenant.arrears)
      }
    })

    const totalArrears = Array.from(buildingArrears.values()).reduce((sum, arrears) => sum + arrears, 0)
    const avgArrearsPerBuilding = buildings?.length ? Math.round(totalArrears / buildings.length) : 0

    // Get occupancy data for the last 6 months
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const { data: occupancyData, error: occupancyError } = await serverClient
      .from("occupancy_history")
      .select("month, occupied_units, vacant_units")
      .eq("company_account_id", userData.company_account_id)
      .gte("month", sixMonthsAgo.toISOString().split("T")[0])
      .order("month", { ascending: true })

    // If no occupancy history, generate from current data
    let occupancyTrend = []

    if (occupancyError || !occupancyData || occupancyData.length === 0) {
      // Generate mock data based on current tenants
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const totalUnits = buildings?.reduce((sum, building) => sum + (building.total_units || 0), 0) || 0
      const occupiedUnits = tenants?.length || 0
      const vacantUnits = Math.max(0, totalUnits - occupiedUnits)

      // Generate trend for last 6 months
      occupancyTrend = Array.from({ length: 6 }, (_, i) => {
        const monthIndex = (now.getMonth() - 5 + i + 12) % 12
        const randomVariation = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
        const occupied = Math.max(0, occupiedUnits - (5 - i) - randomVariation)
        const vacant = Math.max(0, totalUnits - occupied)

        return {
          month: months[monthIndex],
          occupied,
          vacant,
        }
      })
    } else {
      // Format actual occupancy data
      occupancyTrend = occupancyData.map((item) => ({
        month: new Date(item.month).toLocaleString("default", { month: "short" }),
        occupied: item.occupied_units,
        vacant: item.vacant_units,
      }))
    }

    return NextResponse.json({
      rentCollectionRate,
      totalExpected,
      totalCollected,
      avgArrearsPerBuilding,
      totalBuildings: buildings?.length || 0,
      occupancyTrend,
    })
  } catch (error: any) {
    console.error("Unexpected error fetching analytics:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
