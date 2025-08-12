"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function saveTenantsToDB(tenants: any[]) {
  try {
    const supabase = createServerClient()

    // Get user session to associate with company_account_id
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData?.session?.user) {
      throw new Error("Unauthorized")
    }

    // Get user's company_account_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_account_id")
      .eq("id", sessionData.session.user.id)
      .single()

    if (userError || !userData) {
      throw new Error("User not found")
    }

    // Get building IDs for mapping
    const { data: buildings } = await supabase
      .from("buildings")
      .select("id, name")
      .eq("company_account_id", userData.company_account_id)

    const buildingMap = new Map()
    if (buildings) {
      buildings.forEach((building) => {
        buildingMap.set(building.name.toLowerCase(), building.id)
      })
    }

    // Prepare tenant data
    const tenantsToInsert = tenants.map((tenant) => {
      // Try to map building name to building_id
      let building_id = tenant.building_id
      if (!building_id && tenant.building && buildingMap.has(tenant.building.toLowerCase())) {
        building_id = buildingMap.get(tenant.building.toLowerCase())
      }

      return {
        company_account_id: userData.company_account_id,
        name: tenant.name || "Unknown",
        email: tenant.email || null,
        phone: tenant.phone || null,
        unit: tenant.unit || "Unknown",
        building_id: building_id || null,
        move_in_date: tenant.move_in_date || new Date().toISOString(),
        lease_end_date: tenant.lease_end_date || null,
        status: tenant.status || "active",
        rent_status: tenant.rent_status || "current",
        monthly_rent: Number.parseFloat(tenant.monthly_rent) || 0,
        arrears: Number.parseFloat(tenant.arrears) || 0,
        house_size: tenant.house_size || null,
      }
    })

    // Insert tenants in batches of 100
    const batchSize = 100
    const results = []

    for (let i = 0; i < tenantsToInsert.length; i += batchSize) {
      const batch = tenantsToInsert.slice(i, i + batchSize)
      const { data, error } = await supabase.from("tenants").insert(batch).select()

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
        throw new Error(error.message)
      }

      if (data) {
        results.push(...data)
      }
    }

    // Revalidate the tenants page
    revalidatePath("/tenants")

    return true
  } catch (error) {
    console.error("Error saving tenants:", error)
    return false
  }
}

export async function fetchTenants() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("tenants")
      .select(`
        *,
        buildings:building_id(name, address, building_income)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tenants:", error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error) {
    console.error("Error in fetchTenants:", error)
    return []
  }
}

export async function fetchBuildingAnalytics() {
  try {
    const supabase = createServerClient()

    // Get buildings data
    const { data: buildings, error: buildingsError } = await supabase
      .from("buildings")
      .select("id, name, building_income, total_units")

    if (buildingsError) {
      throw new Error(buildingsError.message)
    }

    // Get tenants data
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, building_id, rent_status, monthly_rent, arrears")

    if (tenantsError) {
      throw new Error(tenantsError.message)
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

    // Generate occupancy trend
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    const totalUnits = buildings?.reduce((sum, building) => sum + (building.total_units || 0), 0) || 0
    const occupiedUnits = tenants?.length || 0
    const vacantUnits = Math.max(0, totalUnits - occupiedUnits)

    // Generate trend for last 6 months
    const occupancyTrend = Array.from({ length: 6 }, (_, i) => {
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

    return {
      rentCollectionRate,
      totalExpected,
      totalCollected,
      avgArrearsPerBuilding,
      totalBuildings: buildings?.length || 0,
      occupancyTrend,
    }
  } catch (error) {
    console.error("Error fetching building analytics:", error)
    return {
      rentCollectionRate: 0,
      totalExpected: 0,
      totalCollected: 0,
      avgArrearsPerBuilding: 0,
      totalBuildings: 0,
      occupancyTrend: [],
    }
  }
}
