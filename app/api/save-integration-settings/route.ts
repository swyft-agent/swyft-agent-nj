import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { companyId, settings } = await request.json()

    if (!companyId || !settings) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate that the company exists
    const { data: company, error: companyError } = await supabase
      .from("company_accounts")
      .select("id")
      .eq("id", companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Here you would typically save to environment variables or a secure key management system
    // For now, we'll just return success since the settings are already saved to the database
    // In a production environment, you might want to:
    // 1. Encrypt sensitive data before storing
    // 2. Use a key management service like AWS KMS, Azure Key Vault, etc.
    // 3. Set environment variables dynamically

    console.log(`Integration settings saved for company ${companyId}:`, {
      hasResendKey: !!settings.resend_api_key,
      hasFromEmail: !!settings.resend_from_email,
      hasMpesaKey: !!settings.mpesa_consumer_key,
      hasMpesaSecret: !!settings.mpesa_consumer_secret,
      mpesaEnvironment: settings.mpesa_environment,
    })

    return NextResponse.json({
      success: true,
      message: "Integration settings saved successfully",
    })
  } catch (error: any) {
    console.error("Save integration settings error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
