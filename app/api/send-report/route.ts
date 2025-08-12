import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { to, landlordName, reportHtml, period, companyId } = await request.json()

    if (!to || !landlordName || !reportHtml || !period || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get Resend configuration from database
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("setting_key, setting_value")
      .eq("company_account_id", companyId)
      .in("setting_key", ["resend_api_key", "resend_from_email"])

    if (settingsError) {
      console.error("Error fetching settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch email configuration" }, { status: 500 })
    }

    if (!settings || settings.length === 0) {
      return NextResponse.json(
        { error: "Email configuration not found. Please configure Resend settings in the Settings page." },
        { status: 400 },
      )
    }

    const settingsMap = settings.reduce(
      (acc, setting) => {
        try {
          acc[setting.setting_key] = JSON.parse(setting.setting_value)
        } catch {
          acc[setting.setting_key] = setting.setting_value
        }
        return acc
      },
      {} as Record<string, string>,
    )

    const resendApiKey = settingsMap.resend_api_key
    const fromEmail = settingsMap.resend_from_email

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        { error: "Resend API key or from email not configured. Please check your settings." },
        { status: 400 },
      )
    }

    // Initialize Resend with the API key
    const resend = new Resend(resendApiKey)

    // Send the email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Monthly Revenue Report - ${new Date(period).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Dear ${landlordName},</h2>
          <p>Please find attached your monthly revenue report for ${new Date(period).toLocaleDateString("en-US", { month: "long", year: "numeric" })}.</p>
          <p>This report includes:</p>
          <ul>
            <li>Rental income collected</li>
            <li>Occupancy status and upcoming vacancies</li>
            <li>Expenses breakdown</li>
            <li>Repairs and maintenance summary</li>
            <li>Marketing updates</li>
            <li>Net income after deductions</li>
          </ul>
          <p>If you have any questions about this report, please don't hesitate to contact us.</p>
          <br>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
            ${reportHtml}
          </div>
          <br>
          <p>Best regards,<br>Swyft Agent Team</p>
        </div>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: `Failed to send email: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Report sent successfully",
      emailId: data?.id,
    })
  } catch (error: any) {
    console.error("Send report error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
