import { supabase } from "@/lib/supabase"

export interface DashboardStats {
  totalBuildings: number
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  totalVacantUnits: number
  occupancyRate: number
  monthlyRevenue: number
  totalRevenue: number
  pendingInquiries: number
  totalInquiries: number
  activeNotices: number
  totalTenants: number
  revenueChange: number
  inquiriesChange: number
  recentTransactions: any[]
}

// Helper function to validate UUID
function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid || uuid === "null" || uuid === "" || uuid === "undefined") {
    return false
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Get user's company ID from the database, or return user ID if no company
export async function getUserCompanyId(): Promise<{
  companyId: string | null
  userId: string | null
  isCompanyUser: boolean
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id || !isValidUUID(user.id)) {
      console.log("No authenticated user found or invalid user ID")
      return { companyId: null, userId: null, isCompanyUser: false }
    }

    // Get user data including company info
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_account_id, role, is_company_owner")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return { companyId: null, userId: user.id, isCompanyUser: false }
    }

    // If user has a valid company account, return company ID
    if (userData?.company_account_id && isValidUUID(userData.company_account_id)) {
      return {
        companyId: userData.company_account_id,
        userId: user.id,
        isCompanyUser: true,
      }
    }

    // For individual users (agents, landlords without company), return user ID
    return {
      companyId: null,
      userId: user.id,
      isCompanyUser: false,
    }
  } catch (error) {
    console.error("Error getting user company ID:", error)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return { companyId: null, userId: user?.id || null, isCompanyUser: false }
  }
}

// Fetch dashboard stats with proper error handling
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Wait for user session to be fully loaded
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      console.log("No active session found")
      throw new Error("No active session")
    }

    const { companyId, userId, isCompanyUser } = await getUserCompanyId()
    if (!userId || !isValidUUID(userId)) {
      console.log("No valid user ID found after session check")
      throw new Error("No valid user ID found")
    }

    console.log("Fetching dashboard stats for:", { companyId, userId, isCompanyUser })

    // Build queries based on whether user is part of a company or individual
    const buildingQuery = supabase.from("buildings").select("*")
    const unitsQuery = supabase.from("vacant_units").select("*")
    const tenantsQuery = supabase.from("tenants").select("*")
    const inquiriesQuery = supabase.from("inquiries").select("*")
    const noticesQuery = supabase.from("notices").select("*")

    if (isCompanyUser && companyId && isValidUUID(companyId)) {
      // Company user - filter by company_account_id
      buildingQuery.eq("company_account_id", companyId)
      unitsQuery.eq("company_account_id", companyId)
      tenantsQuery.eq("company_account_id", companyId)
      inquiriesQuery.eq("company_account_id", companyId)
      noticesQuery.eq("company_account_id", companyId)
    } else {
      // Individual user - filter by user_id
      buildingQuery.eq("user_id", userId)
      unitsQuery.eq("user_id", userId)
      tenantsQuery.eq("user_id", userId)
      inquiriesQuery.eq("user_id", userId)
      noticesQuery.eq("user_id", userId)
    }

    const [buildingsResult, unitsResult, tenantsResult, inquiriesResult, noticesResult] = await Promise.all([
      buildingQuery,
      unitsQuery,
      tenantsQuery,
      inquiriesQuery,
      noticesQuery,
    ])

    const buildings = Array.isArray(buildingsResult.data) ? buildingsResult.data : []
    const units = Array.isArray(unitsResult.data) ? unitsResult.data : []
    const tenants = Array.isArray(tenantsResult.data) ? tenantsResult.data : []
    const inquiries = Array.isArray(inquiriesResult.data) ? inquiriesResult.data : []
    const notices = Array.isArray(noticesResult.data) ? noticesResult.data : []

    // Calculate revenue from rent amounts with proper null checks
    const totalRevenue = units.reduce((sum, unit) => {
      const rent = Number.parseFloat(unit.rent_amount || "0")
      return sum + (isNaN(rent) ? 0 : rent)
    }, 0)

    // Calculate vacant and occupied units with proper null checks
    const vacantUnits = units.filter((unit) => unit.status === "available").length
    const occupiedUnits = Math.max(0, units.length - vacantUnits)
    const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0

    // Ensure all values are valid numbers
    const safeOccupancyRate = isNaN(occupancyRate) ? 0 : occupancyRate
    const safeTotalRevenue = isNaN(totalRevenue) ? 0 : totalRevenue

    // Fetch actual recent transactions from wallet_transactions table
    // wallet_transactions has wallet_id and company_account_id, but NO user_id
    let recentTransactions = []
    try {
      if (isCompanyUser && companyId && isValidUUID(companyId)) {
        // For company users, fetch transactions by company_account_id
        const { data: transactions, error: transactionError } = await supabase
          .from("wallet_transactions")
          .select("id, amount, transaction_type, description, status, created_at")
          .eq("company_account_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5)

        if (transactionError) {
          console.error("Error fetching company transactions:", transactionError)
        } else {
          recentTransactions = Array.isArray(transactions) ? transactions : []
        }
      } else if (userId && isValidUUID(userId)) {
        // For individual users, first get their wallet, then fetch transactions by wallet_id
        const { data: walletData, error: walletError } = await supabase
          .from("wallet")
          .select("id")
          .eq("user_id", userId)
          .single()

        if (walletError) {
          console.error("Error fetching user wallet:", walletError)
        } else if (walletData?.id) {
          const { data: transactions, error: transactionError } = await supabase
            .from("wallet_transactions")
            .select("id, amount, transaction_type, description, status, created_at")
            .eq("wallet_id", walletData.id)
            .order("created_at", { ascending: false })
            .limit(5)

          if (transactionError) {
            console.error("Error fetching user transactions:", transactionError)
          } else {
            recentTransactions = Array.isArray(transactions) ? transactions : []
          }
        } else {
          console.log("No wallet found for user, skipping transaction fetch")
        }
      } else {
        console.log("Skipping transaction fetch - no valid user or company ID")
      }
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
      recentTransactions = []
    }

    return {
      totalBuildings: buildings.length,
      totalUnits: units.length,
      vacantUnits: vacantUnits,
      totalVacantUnits: vacantUnits,
      occupiedUnits: occupiedUnits,
      totalTenants: tenants.length,
      pendingInquiries: inquiries.length,
      totalInquiries: inquiries.length,
      activeNotices: notices.length,
      monthlyRevenue: safeTotalRevenue,
      totalRevenue: safeTotalRevenue,
      occupancyRate: safeOccupancyRate,
      revenueChange: 0,
      inquiriesChange: 0,
      recentTransactions: recentTransactions,
    }
  } catch (error) {
    console.error("Dashboard stats fetch error:", error)
    // Return safe default values
    return {
      totalBuildings: 0,
      totalUnits: 0,
      vacantUnits: 0,
      totalVacantUnits: 0,
      occupiedUnits: 0,
      totalTenants: 0,
      pendingInquiries: 0,
      totalInquiries: 0,
      activeNotices: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      occupancyRate: 0,
      revenueChange: 0,
      inquiriesChange: 0,
      recentTransactions: [],
    }
  }
}

// Fetch vacant units with proper error handling and UUID validation
export async function fetchVacantUnits() {
  try {
    const { companyId, userId, isCompanyUser } = await getUserCompanyId()
    if (!userId || !isValidUUID(userId)) {
      console.error("No valid user ID found for fetching vacant units")
      return []
    }

    const query = supabase.from("vacant_units").select("*").order("created_at", { ascending: false })

    if (isCompanyUser && companyId && isValidUUID(companyId)) {
      query.eq("company_account_id", companyId)
    } else {
      query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Vacant units fetch error:", error)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Vacant units fetch error:", error)
    return []
  }
}

// Fetch buildings with proper error handling
export async function fetchBuildings() {
  try {
    const { companyId, userId, isCompanyUser } = await getUserCompanyId()
    if (!userId || !isValidUUID(userId)) {
      console.error("No valid user ID found for fetching buildings")
      return []
    }

    const query = supabase.from("buildings").select("*").order("created_at", { ascending: false })

    if (isCompanyUser && companyId && isValidUUID(companyId)) {
      query.eq("company_account_id", companyId)
    } else {
      query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Buildings fetch error:", error)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Buildings fetch error:", error)
    return []
  }
}

// Other fetch functions with similar error handling...
export async function fetchTenants() {
  try {
    const { companyId, userId, isCompanyUser } = await getUserCompanyId()
    if (!userId || !isValidUUID(userId)) {
      console.error("No valid user ID found for fetching tenants")
      return []
    }

    const query = supabase.from("tenants").select("*").order("created_at", { ascending: false })

    if (isCompanyUser && companyId && isValidUUID(companyId)) {
      query.eq("company_account_id", companyId)
    } else {
      query.eq("user_id", userId)
    }

    const { data, error } = await query
    if (error) {
      console.error("Tenants fetch error:", error)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Tenants fetch error:", error)
    return []
  }
}

export async function fetchInquiries() {
  try {
    const { companyId, userId, isCompanyUser } = await getUserCompanyId()
    if (!userId || !isValidUUID(userId)) {
      console.error("No valid user ID found for fetching inquiries")
      return []
    }

    const query = supabase.from("inquiries").select("*").order("created_at", { ascending: false })

    if (isCompanyUser && companyId && isValidUUID(companyId)) {
      query.eq("company_account_id", companyId)
    } else if (userId && isValidUUID(userId)) {
      query.eq("user_id", userId)
    } else {
      // Return empty array if no valid IDs
      console.log("No valid user or company ID for inquiries fetch")
      return []
    }

    const { data, error } = await query
    if (error) {
      console.error("Inquiries fetch error:", error)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Inquiries fetch error:", error)
    return []
  }
}

export async function fetchNotices() {
  try {
    const { companyId, userId, isCompanyUser } = await getUserCompanyId()
    if (!userId || !isValidUUID(userId)) {
      console.error("No valid user ID found for fetching notices")
      return []
    }

    const query = supabase.from("notices").select("*").order("created_at", { ascending: false })

    if (isCompanyUser && companyId && isValidUUID(companyId)) {
      query.eq("company_account_id", companyId)
    } else if (userId && isValidUUID(userId)) {
      query.eq("user_id", userId)
    } else {
      console.log("No valid user or company ID for notices fetch")
      return []
    }

    const { data, error } = await query
    if (error) {
      console.error("Notices fetch error:", error)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Notices fetch error:", error)
    return []
  }
}

export async function fetchAds() {
  try {
    const { companyId, userId, isCompanyUser } = await getUserCompanyId()
    if (!userId || !isValidUUID(userId)) {
      console.error("No valid user ID found for fetching ads")
      return []
    }

    const query = supabase.from("ads").select("*").order("created_at", { ascending: false })

    if (isCompanyUser && companyId && isValidUUID(companyId)) {
      query.eq("company_account_id", companyId)
    } else if (userId && isValidUUID(userId)) {
      query.eq("user_id", userId)
    } else {
      console.log("No valid user or company ID for ads fetch")
      return []
    }

    const { data, error } = await query
    if (error) {
      console.error("Ads fetch error:", error)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Ads fetch error:", error)
    return []
  }
}
