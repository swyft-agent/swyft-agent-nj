import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("=== Buildings GET API Called ===")

    // Simple query - just get all buildings
    console.log("Fetching buildings...")
    const { data: buildings, error } = await supabase
      .from("buildings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          status: "error",
          message: error.message,
          buildings: [],
        },
        { status: 200 },
      ) // Return 200 with error in JSON
    }

    console.log("✅ Buildings fetched:", buildings?.length || 0)

    return Response.json(
      {
        status: "success",
        buildings: buildings || [],
        count: buildings?.length || 0,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("API Error:", error)
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        buildings: [],
      },
      { status: 200 },
    ) // Always return 200 with error in JSON
  }
}

export async function POST(request: Request) {
  try {
    console.log("=== Buildings POST API Called ===")

    // Parse request body
    const body = await request.json()
    console.log("Received building data:", body)

    // Validate required fields
    if (!body.name || !body.address || !body.city) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required fields: name, address, and city are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Test database connection first
    console.log("Testing database connection...")
    const { data: testData, error: testError } = await supabase.from("buildings").select("count").limit(1)

    if (testError) {
      console.error("Database connection test failed:", testError)
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database connection failed",
          error: testError.message,
          details: testError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("Database connection successful")

    // Prepare building data for insertion
    const buildingData = {
      name: body.name.trim(),
      address: body.address.trim(),
      city: body.city.trim(),
      state: body.state?.trim() || null,
      zip_code: body.zip_code?.trim() || null,
      building_type: body.building_type || null,
      total_units: body.total_units ? Number(body.total_units) : null,
      description: body.description?.trim() || null,
      contact_info: body.contact_info?.trim() || null,
      latitude: body.latitude ? Number(body.latitude) : null,
      longitude: body.longitude ? Number(body.longitude) : null,
      company_account_id: "default-company-123", // TODO: Get from user session
      status: "active",
    }

    console.log("Prepared building data for insertion:", buildingData)

    // Insert building into database
    const { data: insertedBuilding, error: insertError } = await supabase
      .from("buildings")
      .insert([buildingData])
      .select()
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to create building in database",
          error: insertError.message,
          details: insertError,
          hint: insertError.hint,
          code: insertError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("Building created successfully:", insertedBuilding)

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Building created successfully",
        data: insertedBuilding,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Unexpected error in buildings POST:", error)
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unexpected server error",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
