import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, phone, company_account_id } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["admin", "manager", "agent", "landlord"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role,
        company_account_id,
      },
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 })
    }

    // Define access permissions based on role
    const getAccessPermissions = (userRole: string) => {
      const baseAccess = {
        leases: { read: false, write: false },
        reports: { read: false, write: false },
        tenants: { read: false, write: false },
        payments: { read: false, write: false },
        properties: { read: false, write: false },
        user_management: { read: false, write: false },
        company_settings: { read: false, write: false },
        maintenance_requests: { read: false, write: false },
      }

      switch (userRole) {
        case "admin":
          return {
            leases: { read: true, write: true },
            reports: { read: true, write: true },
            tenants: { read: true, write: true },
            payments: { read: true, write: true },
            properties: { read: true, write: true },
            user_management: { read: true, write: true },
            company_settings: { read: true, write: true },
            maintenance_requests: { read: true, write: true },
          }
        case "manager":
          return {
            leases: { read: true, write: true },
            reports: { read: true, write: false },
            tenants: { read: true, write: true },
            payments: { read: true, write: true },
            properties: { read: true, write: true },
            user_management: { read: true, write: false },
            company_settings: { read: false, write: false },
            maintenance_requests: { read: true, write: true },
          }
        case "agent":
          return {
            leases: { read: true, write: false },
            reports: { read: false, write: false },
            tenants: { read: true, write: false },
            payments: { read: false, write: false },
            properties: { read: true, write: false },
            user_management: { read: false, write: false },
            company_settings: { read: false, write: false },
            maintenance_requests: { read: true, write: false },
          }
        case "landlord":
          return {
            leases: { read: true, write: true },
            reports: { read: true, write: false },
            tenants: { read: true, write: true },
            payments: { read: true, write: false },
            properties: { read: true, write: true },
            user_management: { read: false, write: false },
            company_settings: { read: false, write: false },
            maintenance_requests: { read: true, write: true },
          }
        default:
          return baseAccess
      }
    }

    const accessPermissions = getAccessPermissions(role)

    // Create user profile in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        auth_user_id: authData.user.id,
        email,
        name,
        role,
        phone: phone || null,
        company_account_id: company_account_id || null,
        access: accessPermissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error("User profile creation error:", userError)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        company_account_id: userData.company_account_id,
        access: userData.access,
      },
    })
  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
