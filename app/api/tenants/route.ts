import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from("tenants")
      .select(`
        *,
        buildings:building_id(name, address, building_income)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tenants:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tenants: data })
  } catch (error: any) {
    console.error("Unexpected error fetching tenants:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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

    // Validate required fields
    if (!body.name || !body.unit || !body.building_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Prepare tenant data
    const tenantData = {
      company_account_id: userData.company_account_id,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      unit: body.unit,
      building_id: body.building_id,
      move_in_date: body.move_in_date || new Date().toISOString(),
      lease_end_date: body.lease_end_date || null,
      status: body.status || "active",
      rent_status: body.rent_status || "current",
      monthly_rent: body.monthly_rent || 0,
      arrears: body.arrears || 0,
      house_size: body.house_size || null,
    }

    // Insert tenant
    const { data, error } = await serverClient.from("tenants").insert(tenantData).select()

    if (error) {
      console.error("Error creating tenant:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tenant: data[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Unexpected error creating tenant:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const serverClient = createServerClient()
    const body = await request.json()

    // Validate required fields
    if (!body.id) {
      return NextResponse.json({ error: "Missing tenant ID" }, { status: 400 })
    }

    // Update tenant
    const { data, error } = await serverClient
      .from("tenants")
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        unit: body.unit,
        building_id: body.building_id,
        move_in_date: body.move_in_date,
        lease_end_date: body.lease_end_date,
        status: body.status,
        rent_status: body.rent_status,
        monthly_rent: body.monthly_rent,
        arrears: body.arrears,
        house_size: body.house_size,
      })
      .eq("id", body.id)
      .select()

    if (error) {
      console.error("Error updating tenant:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tenant: data[0] })
  } catch (error: any) {
    console.error("Unexpected error updating tenant:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
