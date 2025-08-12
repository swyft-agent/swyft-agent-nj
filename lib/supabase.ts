import { createClient } from "@supabase/supabase-js"

// Updated types for multi-tenant architecture - adjusted to match actual schema
export interface CompanyAccount {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  company_size?: string
  address?: string
  description?: string
  subscription_plan: string
  created_at: string
  updated_at: string
}

// Updated User interface to match the actual database schema
export interface User {
  id: string
  company_account_id: string
  email: string
  company_name: string // Required field in users table
  contact_name: string
  phone?: string
  company_size?: string
  address?: string
  description?: string
  role: "admin" | "agent" | "manager"
  is_company_owner?: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Building {
  id: string
  company_account_id: string
  name: string
  address: string
  city: string
  county?: string
  postal_code?: string
  building_type: string
  total_units: number
  floors?: number
  year_built?: number
  description?: string
  amenities?: string[]
  security_features?: string[]
  utilities?: string[]
  parking_spaces?: number
  elevators?: number
  management_company?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  images?: string[]
  status: "active" | "maintenance" | "archived"
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  company_account_id: string
  building_id: string
  unit_number: string
  bedrooms: number
  bathrooms: number
  size_sqft?: number
  rent_amount: number
  status: "vacant" | "occupied" | "maintenance"
  vacant_since?: string
  vacancy_reason?: "tenant_moved" | "lease_expired" | "maintenance" | "new_unit"
  description?: string
  amenities?: string[]
  images?: string[]
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  company_account_id: string
  unit_id?: string
  name: string
  email: string
  phone: string
  move_in_date: string
  lease_end_date?: string
  status: "active" | "moving-out" | "moved-out"
  rent_status: "current" | "late" | "overdue"
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at: string
  updated_at: string
}

export interface Notice {
  id: string
  company_account_id: string
  tenant_id?: string
  unit_id?: string
  type: "move-in" | "move-out" | "maintenance" | "rent-reminder"
  notice_date: string
  status: "pending" | "approved" | "rejected" | "completed"
  description?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Inquiry {
  id: string
  company_account_id: string
  tenant_id?: string
  unit_id?: string
  subject: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in-progress" | "resolved" | "closed"
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  company_account_id: string
  tenant_id?: string
  unit_id?: string
  description: string
  amount: number
  type: "rent" | "deposit" | "maintenance" | "commission" | "expense"
  status: "pending" | "completed" | "cancelled" | "refunded"
  transaction_date: string
  due_date?: string
  payment_method?: string
  reference_number?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// Helper function for retrying fetch operations
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export async function retryFetch(operation: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await operation()
  } catch (error) {
    if (retries <= 0) throw error
    console.warn(`Operation failed, retrying... (${retries} attempts left)`, error)
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
    return retryFetch(operation, retries - 1)
  }
}

// Environment variables - check both client and server side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug environment variables
console.log("Environment check:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0,
})

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  throw new Error("Missing Supabase URL. Please check your environment variables.")
}

if (!supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
  throw new Error("Missing Supabase Anon Key. Please check your environment variables.")
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// For server-side operations
export const createServerClient = () => {
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!serverUrl || !serverKey) {
    throw new Error("Missing server-side Supabase environment variables")
  }

  return createClient(serverUrl, serverKey)
}

// Toggle development mode (for testing purposes)
export function toggleDevMode(enabled = false) {
  console.log(`Development mode ${enabled ? "enabled" : "disabled"}`)
  return enabled
}

// Export both the client instance and the createClient function
export { createClient } from "@supabase/supabase-js"
export const isUsingMockData = false

// Test connection function
export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...")
    const { data, error } = await supabase.from("users").select("count").limit(1)
    if (error) throw error
    console.log("Supabase connection test successful")
    return { connected: true, error: null }
  } catch (error) {
    console.error("Supabase connection test failed:", error)
    return { connected: false, error }
  }
}
