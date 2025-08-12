import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { uploadId, dataType, normalizedData, companyId, userId } = await request.json()

    if (!uploadId || !dataType || !normalizedData || !companyId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let insertedCount = 0
    const errors: string[] = []

    // Add company and user IDs to each record
    const dataWithIds = normalizedData.map((record: any) => ({
      ...record,
      company_account_id: companyId,
      user_id: userId,
    }))

    // Insert data into the appropriate table
    switch (dataType) {
      case "tenants":
        const { data: tenantData, error: tenantError } = await supabase.from("tenants").insert(dataWithIds).select()

        if (tenantError) {
          errors.push(`Tenants: ${tenantError.message}`)
        } else {
          insertedCount = tenantData?.length || 0
        }
        break

      case "buildings":
        const { data: buildingData, error: buildingError } = await supabase
          .from("buildings")
          .insert(dataWithIds)
          .select()

        if (buildingError) {
          errors.push(`Buildings: ${buildingError.message}`)
        } else {
          insertedCount = buildingData?.length || 0
        }
        break

      case "expenses":
        const { data: expenseData, error: expenseError } = await supabase.from("expenses").insert(dataWithIds).select()

        if (expenseError) {
          errors.push(`Expenses: ${expenseError.message}`)
        } else {
          insertedCount = expenseData?.length || 0
        }
        break

      case "units":
        const { data: unitData, error: unitError } = await supabase.from("units").insert(dataWithIds).select()

        if (unitError) {
          errors.push(`Units: ${unitError.message}`)
        } else {
          insertedCount = unitData?.length || 0
        }
        break

      case "payments":
        const { data: paymentData, error: paymentError } = await supabase.from("payments").insert(dataWithIds).select()

        if (paymentError) {
          errors.push(`Payments: ${paymentError.message}`)
        } else {
          insertedCount = paymentData?.length || 0
        }
        break

      default:
        return NextResponse.json({ error: "Unsupported data type" }, { status: 400 })
    }

    // Update upload record
    await supabase
      .from("uploads")
      .update({
        processed_rows: insertedCount,
        status: errors.length > 0 ? "failed" : "processed",
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("id", uploadId)

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Some data failed to insert",
          details: errors,
          insertedCount,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      message: `Successfully inserted ${insertedCount} ${dataType} records`,
    })
  } catch (error) {
    console.error("Error saving data:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}
