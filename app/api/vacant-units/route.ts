import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// CORS configuration for Swyft Housing
const ALLOWED_ORIGINS = [
  "https://move.swyft.africa",
  "http://localhost:5173",
]
const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
const ALLOWED_HEADERS = ["Content-Type", "Authorization"]

// Helper function to set CORS headers
function setCorsHeaders(response: NextResponse, origin?: string) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
  }
  response.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "))
  response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "))
  return response
}

// Helper function to validate origin
function validateOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin")
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    return origin
  }
  return null
}

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = validateOrigin(request)
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(response, origin || undefined)
}

// GET - Fetch all available vacant units (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const origin = validateOrigin(request)
    if (!origin) {
      const response = NextResponse.json({ error: "Forbidden: Invalid origin" }, { status: 403 })
      return setCorsHeaders(response)
    }

    const { data: vacantUnits, error } = await supabase
      .from("vacant_units")
      .select(`
        id,
        company_account_id,
        title,
        description,
        property_type,
        bedrooms,
        bathrooms,
        square_feet,
        rent_amount,
        deposit_amount,
        address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        amenities,
        pet_policy,
        parking_available,
        utilities_included,
        images,
        virtual_tour_url,
        status,
        featured,
        created_at,
        updated_at,
        created_by,
        contact_info,
        building_id,
        viewing_fee,
        house_number,
        frequency,
        role,
        available_from,
        selling_price,
        category,
        user_id,
        building_name
      `)
      .eq("status", "available")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vacant units:", error)
      const response = NextResponse.json(
        { error: "Failed to fetch vacant units", details: error.message },
        { status: 500 },
      )
      return setCorsHeaders(response, origin)
    }

    const response = NextResponse.json({
      success: true,
      data: vacantUnits || [],
      count: vacantUnits?.length || 0,
    })
    return setCorsHeaders(response, origin)
  } catch (error) {
    console.error("Unexpected error in GET /api/vacant-units:", error)
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 })
    return setCorsHeaders(response)
  }
}

// POST - Create a new vacant unit (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const origin = validateOrigin(request)
    if (!origin) {
      const response = NextResponse.json({ error: "Forbidden: Invalid origin" }, { status: 403 })
      return setCorsHeaders(response)
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["title", "property_type", "rent_amount", "address", "city"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      const response = NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      )
      return setCorsHeaders(response, origin)
    }

    // Set default values for optional fields
    const vacantUnitData = {
      title: body.title,
      description: body.description || null,
      property_type: body.property_type,
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 0,
      square_feet: body.square_feet || 0,
      rent_amount: body.rent_amount,
      deposit_amount: body.deposit_amount || 0,
      address: body.address,
      city: body.city,
      state: body.state || "",
      zip_code: body.zip_code || "",
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      amenities: body.amenities || [],
      pet_policy: body.pet_policy || null,
      parking_available: body.parking_available || false,
      utilities_included: body.utilities_included || [],
      images: body.images || [],
      virtual_tour_url: body.virtual_tour_url || null,
      status: body.status || "available",
      featured: body.featured || false,
      contact_info: body.contact_info || "",
      building_id: body.building_id || null,
      viewing_fee: body.viewing_fee || 500,
      house_number: body.house_number || "",
      frequency: body.frequency || 3,
      role: body.role || "agent",
      available_from: body.available_from || new Date().toISOString().split("T")[0],
      selling_price: body.selling_price || 0,
      category: body.category || "for rent",
      company_account_id: body.company_account_id || null,
      user_id: body.user_id || null,
      building_name: body.building_name || null,
      created_by: body.created_by || null,
    }

    const { data: newUnit, error } = await supabase.from("vacant_units").insert([vacantUnitData]).select().single()

    if (error) {
      console.error("Error creating vacant unit:", error)
      const response = NextResponse.json(
        { error: "Failed to create vacant unit", details: error.message },
        { status: 500 },
      )
      return setCorsHeaders(response, origin)
    }

    const response = NextResponse.json(
      {
        success: true,
        data: newUnit,
        message: "Vacant unit created successfully",
      },
      { status: 201 },
    )
    return setCorsHeaders(response, origin)
  } catch (error) {
    console.error("Unexpected error in POST /api/vacant-units:", error)
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 })
    return setCorsHeaders(response)
  }
}

// PUT - Update an existing vacant unit (public endpoint)
export async function PUT(request: NextRequest) {
  try {
    const origin = validateOrigin(request)
    if (!origin) {
      const response = NextResponse.json({ error: "Forbidden: Invalid origin" }, { status: 403 })
      return setCorsHeaders(response)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      const response = NextResponse.json({ error: "Unit ID is required" }, { status: 400 })
      return setCorsHeaders(response, origin)
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      const response = NextResponse.json({ error: "Invalid unit ID format" }, { status: 400 })
      return setCorsHeaders(response, origin)
    }

    const body = await request.json()

    // Remove fields that shouldn't be updated
    const { id: bodyId, created_at, ...updateData } = body

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data: updatedUnit, error } = await supabase
      .from("vacant_units")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating vacant unit:", error)
      const response = NextResponse.json(
        { error: "Failed to update vacant unit", details: error.message },
        { status: 500 },
      )
      return setCorsHeaders(response, origin)
    }

    if (!updatedUnit) {
      const response = NextResponse.json({ error: "Unit not found" }, { status: 404 })
      return setCorsHeaders(response, origin)
    }

    const response = NextResponse.json({
      success: true,
      data: updatedUnit,
      message: "Vacant unit updated successfully",
    })
    return setCorsHeaders(response, origin)
  } catch (error) {
    console.error("Unexpected error in PUT /api/vacant-units:", error)
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 })
    return setCorsHeaders(response)
  }
}
