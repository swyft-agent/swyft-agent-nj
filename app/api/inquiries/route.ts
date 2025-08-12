import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
  if (!uuid || uuid === "null" || uuid === "undefined" || uuid.trim() === "") {
    return false
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "https://swyft-housing.vercel.app",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("company_id")
    const userId = searchParams.get("user_id")
    const isPublic = searchParams.get("public") === "true"

    // For public API access, return limited data
    if (isPublic) {
      const { data: inquiries, error } = await supabase
        .from("inquiries")
        .select("id, subject, priority, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching public inquiries:", error)
        return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500, headers })
      }

      return NextResponse.json({ data: inquiries }, { headers })
    }

    // For authenticated requests, require either company_id or user_id
    if (!companyId && !userId) {
      return NextResponse.json({ error: "Company ID or User ID required" }, { status: 400, headers })
    }

    let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false })

    // Filter by company_id if provided and valid
    if (companyId && isValidUUID(companyId)) {
      query = query.eq("company_account_id", companyId)
    }
    // Otherwise filter by user_id if provided and valid
    else if (userId && isValidUUID(userId)) {
      query = query.eq("user_id", userId)
    } else {
      return NextResponse.json({ error: "Valid Company ID or User ID required" }, { status: 400, headers })
    }

    const { data: inquiries, error } = await query

    if (error) {
      console.error("Error fetching inquiries:", error)
      return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500, headers })
    }

    return NextResponse.json({ data: inquiries }, { headers })
  } catch (error) {
    console.error("Inquiries API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers })
  }
}

export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "https://swyft-housing.vercel.app",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const body = await request.json()
    const { subject, priority, description, company_account_id, user_id } = body

    // Validate required fields
    if (!subject || !priority) {
      return NextResponse.json({ error: "Subject and priority are required" }, { status: 400, headers })
    }

    // Require either company_account_id or user_id
    if (!company_account_id && !user_id) {
      return NextResponse.json({ error: "Company ID or User ID required" }, { status: 400, headers })
    }

    // Validate UUIDs if provided
    if (company_account_id && !isValidUUID(company_account_id)) {
      return NextResponse.json({ error: "Invalid Company ID format" }, { status: 400, headers })
    }

    if (user_id && !isValidUUID(user_id)) {
      return NextResponse.json({ error: "Invalid User ID format" }, { status: 400, headers })
    }

    const inquiryData = {
      subject,
      priority,
      description: description || "",
      status: "open",
      ...(company_account_id && { company_account_id }),
      ...(user_id && { user_id }),
    }

    const { data: inquiry, error } = await supabase.from("inquiries").insert([inquiryData]).select().single()

    if (error) {
      console.error("Error creating inquiry:", error)
      return NextResponse.json({ error: "Failed to create inquiry" }, { status: 500, headers })
    }

    return NextResponse.json({ data: inquiry }, { status: 201, headers })
  } catch (error) {
    console.error("Inquiries POST API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://swyft-housing.vercel.app",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
