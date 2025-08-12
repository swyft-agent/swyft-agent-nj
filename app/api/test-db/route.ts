import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("Testing database connection...")

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("Supabase URL:", supabaseUrl ? "Set" : "Not set")
    console.log("Supabase Key:", supabaseKey ? "Set (hidden)" : "Not set")

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Missing Supabase credentials",
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection with a simple query
    const { data, error } = await supabase.from("buildings").select("count").limit(1)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 },
      )
    }

    // Get table structure
    const { data: tableInfo, error: tableError } = await supabase.from("buildings").select("*").limit(1)

    if (tableError) {
      console.error("Error fetching table structure:", tableError)
    }

    const columnNames = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : []

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      count: data,
      tableExists: true,
      columns: columnNames,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
