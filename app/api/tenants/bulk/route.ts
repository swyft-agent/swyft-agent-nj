import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const serverClient = createServerClient()
    const body = await request.json()

    // Get user session to associate with company_account_id
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

    // Validate tenants array
    if (!Array.isArray(body.tenants) || body.tenants.length === 0) {
      return NextResponse.json({ error: "No tenants provided" }, { status: 400 })
    }

    // Get building IDs for mapping
    const { data: buildings } = await serverClient
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
    const tenantsToInsert = body.tenants.map((tenant: any) => {
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
      const { data, error } = await serverClient.from("tenants").insert(batch).select()

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (data) {
        results.push(...data)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${results.length} tenants`,
        count: results.length,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Unexpected error creating tenants:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
