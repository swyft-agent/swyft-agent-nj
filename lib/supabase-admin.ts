// Server-only Supabase Service Role client and role-based default access helpers.

import { createClient } from "@supabase/supabase-js"

type Permission = "read" | "write" | "delete" | "manage" | "admin"
type ModuleKey =
  | "properties"
  | "tenants"
  | "leases"
  | "payments"
  | "maintenance_requests"
  | "reports"
  | "company_settings"
  | "user_management"

// AccessPayload matches jsonb[] where we store a single object mapping modules -> permissions[]
export type AccessPayload = Array<Partial<Record<ModuleKey, Permission[]>>>

const MODULES: ModuleKey[] = [
  "properties",
  "tenants",
  "leases",
  "payments",
  "maintenance_requests",
  "reports",
  "company_settings",
  "user_management",
]

// Returns a Supabase service client or throws a descriptive error.
// Use only in Route Handlers or Server Actions.
export function getServiceSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("Environment check:", {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceRole: !!serviceRole,
    nodeEnv: process.env.NODE_ENV,
  })

  if (!supabaseUrl || !serviceRole) {
    const missing = [!supabaseUrl ? "SUPABASE_URL" : null, !serviceRole ? "SUPABASE_SERVICE_ROLE_KEY" : null]
      .filter(Boolean)
      .join(", ")
    const hint =
      "These server environment variables are required for admin operations. In Vercel, set them in Project Settings → Environment Variables. Locally, ensure they're available to the server runtime."
    throw new Error(`Server is not configured for admin operations. Missing: ${missing}. ${hint}`)
  }

  return createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Default access map by role. Adjust as needed for your policy.
export function defaultAccessForRole(role?: string | null): AccessPayload | null {
  const all: Permission[] = ["read", "write", "delete", "manage", "admin"]
  const readManage: Permission[] = ["read", "write", "delete", "manage"]
  const readWrite: Permission[] = ["read", "write"]
  const readOnly: Permission[] = ["read"]

  let perms: Record<ModuleKey, Permission[]>

  switch ((role || "").toLowerCase()) {
    case "admin":
      perms = {
        properties: all,
        tenants: all,
        leases: all,
        payments: all,
        maintenance_requests: all,
        reports: all,
        company_settings: all,
        user_management: all,
      }
      break
    case "manager":
      perms = {
        properties: readManage,
        tenants: readManage,
        leases: readManage,
        payments: readManage,
        maintenance_requests: readManage,
        reports: readManage,
        company_settings: readManage,
        user_management: ["read"], // view team, not full manage
      }
      break
    case "agent":
      perms = {
        properties: readWrite,
        tenants: readWrite,
        leases: readWrite,
        payments: ["read"],
        maintenance_requests: readWrite,
        reports: ["read"],
        company_settings: [],
        user_management: [],
      }
      break
    case "landlord":
      perms = {
        properties: ["read"],
        tenants: ["read"],
        leases: ["read"],
        payments: ["read"],
        maintenance_requests: ["read"],
        reports: ["read"],
        company_settings: [],
        user_management: [],
      }
      break
    default:
      // If role unknown, no explicit access assigned
      return null
  }

  const obj: Partial<Record<ModuleKey, Permission[]>> = {}
  MODULES.forEach((m) => {
    obj[m] = perms[m] || []
  })
  return [obj]
}

// Utility: determine if any module has "admin" permission in users.access
export function hasAdminPermission(access: AccessPayload | null | undefined): boolean {
  if (!access || access.length === 0) return false
  const first = access[0] || {}
  return MODULES.some((m) => Array.isArray(first[m]) && (first[m] as Permission[]).includes("admin"))
}
