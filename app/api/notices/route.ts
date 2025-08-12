import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("company_id")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    const { data: notices, error } = await supabase
      .from("notices")
      .select("*")
      .eq("company_account_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Notices fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 })
    }

    return NextResponse.json({ notices: notices || [] })
  } catch (error) {
    console.error("Notices API error:", error)
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await supabase.from("notices").insert([body]).select()

    if (error) {
      console.error("Insert notice error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notice: data[0] })
  } catch (error) {
    console.error("POST notice error:", error)
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 })
  }
}
