import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from("vacant_units")
      .select(`
        *,
        company_accounts(company_name, contact_name, email, phone)
      `)
      .eq("id", params.id)
      .eq("status", "available")
      .single()

    if (error) {
      console.error("Error fetching vacant unit:", error)
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }

    // Transform data for external consumption
    const transformedData = {
      id: data.id,
      title: data.title,
      description: data.description,
      property_type: data.property_type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      square_feet: data.square_feet,
      rent_amount: data.rent_amount,
      security_deposit: data.security_deposit,
      deposit_amount: data.deposit_amount,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
      latitude: data.latitude,
      longitude: data.longitude,
      images: data.images,
      amenities: data.amenities,
      pet_policy: data.pet_policy,
      parking: data.parking,
      parking_available: data.parking_available,
      utilities_included: data.utilities_included,
      laundry: data.laundry,
      lease_terms: data.lease_terms,
      available_date: data.available_date,
      virtual_tour_url: data.virtual_tour_url,
      contact_info: data.contact_info,
      status: data.status,
      featured: data.featured,
      building_id: data.building_id,
      house_number: data.house_number,
      viewing_fee: data.viewing_fee,
      created_by: data.created_by,
      company: {
        name: data.company_accounts?.company_name,
        contact: data.company_accounts?.contact_name,
        email: data.company_accounts?.email,
        phone: data.company_accounts?.phone,
      },
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    return NextResponse.json({
      success: true,
      data: transformedData,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const unitId = params.id

    if (!unitId) {
      return NextResponse.json({ error: "Unit ID is required" }, { status: 400 })
    }

    // First, check if the unit exists
    const { data: existingUnit, error: fetchError } = await supabase
      .from("vacant_units")
      .select("id, title")
      .eq("id", unitId)
      .single()

    if (fetchError || !existingUnit) {
      console.error("Unit not found:", fetchError)
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }

    // Delete the unit
    const { error: deleteError } = await supabase.from("vacant_units").delete().eq("id", unitId)

    if (deleteError) {
      console.error("Error deleting unit:", deleteError)
      return NextResponse.json(
        {
          error: "Failed to delete unit",
          details: deleteError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Unit "${existingUnit.title}" deleted successfully`,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Enable CORS for external access
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
