import { NextResponse } from "next/server"
import { getServiceSupabase, defaultAccessForRole } from "@/lib/supabase-admin"

type Body = {
  email: string
  password: string
  name: string
  phone: string
  address?: string | null
  description?: string | null
  role?: "landlord" | "agent" | "manager" | "admin" | null
  is_company_owner?: boolean
  company_account_id?: string | null
}

/**
 * Admin-only endpoint to create/invite an auth user and upsert a matching row in public.users.
 * - Uses Supabase Service Role (server-only).
 * - Assigns default permissions into users.access (jsonb[]) based on role.
 * - Creates user with password for immediate login capability.
 */
export async function POST(req: Request) {
  try {
    console.log("Create user API called")
    const body = (await req.json()) as Body
    console.log("Request body:", {
      ...body,
      email: body.email ? "[REDACTED]" : undefined,
      password: body.password ? "[REDACTED]" : undefined,
    })

    if (!body.email || !body.password || !body.name || !body.phone) {
      return NextResponse.json({ error: "Missing required fields: email, password, name, phone." }, { status: 400 })
    }

    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 })
    }

    if (!body.company_account_id) {
      return NextResponse.json(
        { error: "No company account found. Please ensure you're logged in with a valid company account." },
        { status: 400 },
      )
    }

    console.log("Getting service supabase client...")
    const supabaseAdmin = getServiceSupabase()
    console.log("Service client created successfully")

    // 1) Create an auth user with password for immediate login
    console.log("Creating auth user with password...")
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        name: body.name,
        phone: body.phone,
        address: body.address ?? null,
        description: body.description ?? null,
        role: body.role ?? null,
        company_account_id: body.company_account_id,
        is_company_owner: Boolean(body.is_company_owner),
      },
    })

    if (createErr) {
      console.error("Auth user creation error:", createErr)
      return NextResponse.json({ error: createErr.message }, { status: 400 })
    }

    const authUserId = created.user?.id
    if (!authUserId) {
      return NextResponse.json({ error: "Auth user creation returned no user id." }, { status: 500 })
    }

    console.log("Auth user created with ID:", authUserId)

    // 2) Compute default access by role
    const accessPayload = defaultAccessForRole(body.role)
    console.log("Default access computed for role:", body.role)

    // 3) Upsert profile row with all required fields
    const now = new Date().toISOString()
    console.log("Upserting user profile...")
    const { data: profile, error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: authUserId,
          email: body.email,
          name: body.name,
          phone: body.phone,
          address: body.address ?? null,
          description: body.description ?? null,
          role: body.role ?? null,
          company_account_id: body.company_account_id,
          is_company_owner: Boolean(body.is_company_owner),
          access: accessPayload,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "id" },
      )
      .select(
        "id, email, name, phone, address, description, role, is_company_owner, company_account_id, access, created_at, updated_at",
      )
      .single()

    if (upsertErr) {
      console.error("Profile upsert error:", upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 400 })
    }

    console.log("User created successfully")
    return NextResponse.json(
      {
        user: profile,
        message: "User created successfully. They can now login with their email and password.",
      },
      { status: 200 },
    )
  } catch (e: any) {
    console.error("Unexpected error in create-user API:", e)
    // Ensure we surface env misconfiguration explicitly
    const msg = typeof e?.message === "string" ? e.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
