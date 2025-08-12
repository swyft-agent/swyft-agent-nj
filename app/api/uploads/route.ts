import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role client for all operations to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("company_id")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    const { data: uploads, error } = await supabaseAdmin
      .from("uploads")
      .select("*")
      .eq("company_account_id", companyId)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Error fetching uploads:", error)
      return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 })
    }

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error("Error in uploads API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const companyId = formData.get("company_id") as string
    const userId = formData.get("user_id") as string

    console.log("Upload request:", { fileName: file?.name, companyId, userId })

    if (!file || !companyId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV and Excel files are allowed" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}_${sanitizedFileName}`
    const filePath = `uploads/${companyId}/${fileName}`

    console.log("Uploading to path:", filePath)

    // Upload file to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    console.log("File uploaded successfully:", uploadData)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("documents").getPublicUrl(filePath)

    console.log("Public URL:", publicUrl)

    // Save metadata to database using admin client
    const uploadRecord = {
      company_account_id: companyId,
      user_id: userId,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      file_type: file.type,
      status: "uploaded",
    }

    console.log("Inserting upload record:", uploadRecord)

    const { data: insertedRecord, error: dbError } = await supabaseAdmin
      .from("uploads")
      .insert(uploadRecord)
      .select()
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: `Database insert failed: ${dbError.message}` }, { status: 500 })
    }

    console.log("Upload record saved successfully:", insertedRecord)

    return NextResponse.json({ upload: insertedRecord })
  } catch (error) {
    console.error("Error in upload API:", error)
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
