import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUGGING VACANT UNITS SCHEMA ===")

    // First, let's see what columns actually exist by selecting everything
    const { data: rawData, error: rawError } = await supabase.from("vacant_units").select("*").limit(1)

    if (rawError) {
      console.error("Raw query error:", rawError)
      return NextResponse.json(
        {
          error: "Database error",
          details: rawError.message,
          step: "raw_query",
        },
        { status: 500 },
      )
    }

    console.log("Raw data from database:", rawData)

    // Get the actual column names from the first record
    const columnNames = rawData && rawData.length > 0 ? Object.keys(rawData[0]) : []
    console.log("Available columns:", columnNames)

    // Check specifically for our target fields
    const hasViewingFee = columnNames.includes("viewing_fee")
    const hasHouseNumber = columnNames.includes("house_number")

    console.log("Has viewing_fee:", hasViewingFee)
    console.log("Has house_number:", hasHouseNumber)

    // Now let's try the full query with company info
    const { data: fullData, error: fullError } = await supabase
      .from("vacant_units")
      .select(`
        *,
        company_accounts(company_name)
      `)
      .eq("status", "available")
      .limit(2)

    if (fullError) {
      console.error("Full query error:", fullError)
      return NextResponse.json(
        {
          error: "Full query failed",
          details: fullError.message,
          step: "full_query",
        },
        { status: 500 },
      )
    }

    console.log("Full data with company:", fullData)

    return NextResponse.json({
      success: true,
      debug_info: {
        table_name: "vacant_units",
        available_columns: columnNames,
        total_columns: columnNames.length,
        has_viewing_fee: hasViewingFee,
        has_house_number: hasHouseNumber,
        raw_sample: rawData?.[0] || null,
        full_sample: fullData?.[0] || null,
        total_records: fullData?.length || 0,
      },
    })
  } catch (error) {
    console.error("Debug API Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        step: "catch_block",
      },
      { status: 500 },
    )
  }
}
