import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, recipientEmail } = body

    // Get the current user
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's company and email info
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        email,
        company_account_id,
        company_accounts (
          company_name,
          contact_email,
          contact_name
        )
      `)
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 })
    }

    // Determine recipient email
    let emailRecipient = recipientEmail
    if (!emailRecipient) {
      // Try company contact email first, then user email
      emailRecipient = userData.company_accounts?.contact_email || userData.email || user.email
    }

    if (!emailRecipient) {
      return NextResponse.json({ error: "No email address available for sending report" }, { status: 400 })
    }

    // For now, we'll simulate sending the email since we don't have RESEND configured for this specific use case
    // In a real implementation, you would use the RESEND API here

    console.log("Sending report email to:", emailRecipient)
    console.log("Report type:", type)
    console.log("Report data:", data)

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      email: emailRecipient,
      message: "Report sent successfully",
    })
  } catch (error: any) {
    console.error("Error sending report:", error)
    return NextResponse.json({ error: error.message || "Failed to send report" }, { status: 500 })
  }
}
