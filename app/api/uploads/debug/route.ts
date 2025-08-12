import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
        openaiKey: process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing",
      },
      storage: {
        bucketExists: false,
        bucketPublic: false,
        canUpload: false,
        error: null,
      },
      database: {
        uploadsTableExists: false,
        canInsert: false,
        error: null,
      },
    }

    // Test storage bucket
    try {
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

      if (bucketsError) {
        diagnostics.storage.error = bucketsError.message
      } else {
        const documentsBucket = buckets?.find((b) => b.id === "documents")
        diagnostics.storage.bucketExists = !!documentsBucket
        diagnostics.storage.bucketPublic = documentsBucket?.public || false
      }

      // Test file upload
      if (diagnostics.storage.bucketExists) {
        const testFile = new File(["test"], "test.txt", { type: "text/plain" })
        const { error: uploadError } = await supabaseAdmin.storage
          .from("documents")
          .upload(`test/${Date.now()}.txt`, testFile)

        if (uploadError) {
          diagnostics.storage.error = uploadError.message
        } else {
          diagnostics.storage.canUpload = true
          // Clean up test file
          await supabaseAdmin.storage.from("documents").remove([`test/${Date.now()}.txt`])
        }
      }
    } catch (error) {
      diagnostics.storage.error = error instanceof Error ? error.message : "Unknown storage error"
    }

    // Test database
    try {
      const { data, error: tableError } = await supabaseAdmin.from("uploads").select("id").limit(1)

      if (tableError) {
        diagnostics.database.error = tableError.message
      } else {
        diagnostics.database.uploadsTableExists = true
        diagnostics.database.canInsert = true
      }
    } catch (error) {
      diagnostics.database.error = error instanceof Error ? error.message : "Unknown database error"
    }

    return NextResponse.json({ diagnostics })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Diagnostic failed" }, { status: 500 })
  }
}
