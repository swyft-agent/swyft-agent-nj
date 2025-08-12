import { type NextRequest, NextResponse } from "next/server"
import { analyzeCSVData, normalizeAllData } from "@/lib/openai"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { uploadId, headers, sampleRows, allRows } = await request.json()

    if (!uploadId || !headers || !sampleRows) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // Update upload status to analyzing
    await supabase.from("uploads").update({ status: "analyzing" }).eq("id", uploadId)

    // Analyze the data with AI
    const analysis = await analyzeCSVData(headers, sampleRows)

    // If we have all rows and a detected type, normalize all data
    let normalizedData = analysis.normalizedData
    if (allRows && analysis.detectedType !== "unknown") {
      normalizedData = await normalizeAllData(headers, allRows, analysis.detectedType)
    }

    // Update upload record with analysis results
    const { error: updateError } = await supabase
      .from("uploads")
      .update({
        status: "processed",
        detected_type: analysis.detectedType,
        ai_analysis: {
          confidence: analysis.confidence,
          suggestions: analysis.suggestions,
          errors: analysis.errors,
        },
        total_rows: allRows?.length || sampleRows.length,
      })
      .eq("id", uploadId)

    if (updateError) {
      console.error("Error updating upload record:", updateError)
    }

    return NextResponse.json({
      analysis: {
        ...analysis,
        normalizedData,
      },
    })
  } catch (error) {
    console.error("Error analyzing data:", error)

    // Update upload status to failed
    if (request.json) {
      const { uploadId } = await request.json()
      if (uploadId) {
        await supabase
          .from("uploads")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Analysis failed",
          })
          .eq("id", uploadId)
      }
    }

    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
