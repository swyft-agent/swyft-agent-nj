import { supabase } from "./supabase"

export interface SignUpData {
  email: string
  password: string
  companyName: string
  contactName: string
  phone: string
  companySize?: string
  address?: string
  description?: string
  userRole: "agent" | "landlord" | "company"
  // Role-specific fields
  licenseNumber?: string
  yearsExperience?: string
  propertyCount?: string
  propertyTypes?: string
  serviceAreas?: string
}

export async function signUp(data: SignUpData) {
  try {
    console.log("Starting signup process...", { email: data.email, role: data.userRole })

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return {
        data: null,
        error: { message: "Please enter a valid email address" },
      }
    }

    // Step 1: Create the user account with Supabase Auth
    console.log("Creating auth user...")
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.contactName,
          company_name: data.companyName,
          user_role: data.userRole,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { data: null, error: authError }
    }

    if (!authData.user) {
      console.error("No user returned from auth signup")
      return { data: null, error: { message: "Failed to create user account" } }
    }

    console.log("User created successfully:", authData.user.id)

    // Check if email confirmation is required
    if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
      console.log("Email confirmation required")
      return {
        data: {
          user: authData.user,
          session: null,
          requiresConfirmation: true,
          company: null,
          profile: null,
        },
        error: null,
      }
    }

    // If we have a session, proceed with company and profile creation
    if (authData.session || authData.user.email_confirmed_at) {
      return await createCompanyAndProfile(authData, data)
    }

    return {
      data: {
        user: authData.user,
        session: authData.session,
        requiresConfirmation: true,
        company: null,
        profile: null,
      },
      error: null,
    }
  } catch (error: any) {
    console.error("Signup error:", error)
    return {
      data: null,
      error: { message: `An unexpected error occurred during signup: ${error.message || "Unknown error"}` },
    }
  }
}

// Helper function to create company and profile
async function createCompanyAndProfile(authData: any, data: SignUpData) {
  try {
    console.log("Creating company and profile for confirmed user...")

    // Step 2: Create company account first
    console.log("Creating company account...")
    const { data: newCompany, error: companyError } = await supabase
      .from("company_accounts")
      .insert({
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        company_size: data.companySize || "",
        address: data.address || "",
        description: data.description || "",
        subscription_plan: data.userRole === "company" ? "professional" : "basic",
        is_active: true,
        owner_id: authData.user.id,
        // Role-specific metadata
        user_role: data.userRole,
        service_areas: data.serviceAreas || "",
      })
      .select()
      .single()

    if (companyError) {
      console.error("Company creation error:", companyError)
      return { data: null, error: { message: `Failed to create company: ${companyError.message}` } }
    }

    console.log("Company created successfully:", newCompany.id)

    // Step 3: Create user profile with role-specific data
    console.log("Creating user profile...")
    const userProfileData = {
      id: authData.user.id,
      email: data.email,
      name: data.contactName,
      phone: data.phone,
      address: data.address || "",
      description: data.description || "",
      role: data.userRole === "company" ? "admin" : data.userRole,
      company_account_id: newCompany.id,
      is_company_owner: true,
      company_name: data.companyName,
      contact_name: data.contactName,
      // Role-specific fields
      user_role: data.userRole,
      license_number: data.licenseNumber || "",
      years_experience: data.yearsExperience || "",
      property_count: data.propertyCount || "",
      property_types: data.propertyTypes || "",
    }

    const { data: newProfile, error: profileError } = await supabase
      .from("users")
      .insert(userProfileData)
      .select()
      .single()

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return { data: null, error: { message: `Failed to create profile: ${profileError.message}` } }
    }

    console.log("Profile created successfully")

    return {
      data: {
        user: authData.user,
        session: authData.session,
        company: newCompany,
        profile: newProfile,
        requiresConfirmation: false,
      },
      error: null,
    }
  } catch (error: any) {
    console.error("Company/Profile creation error:", error)
    return {
      data: null,
      error: { message: `Failed to create company and profile: ${error.message || "Unknown error"}` },
    }
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log("Starting signin process...", { email })

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Login timeout - please try again")), 10000),
    )

    const loginPromise = supabase.auth.signInWithPassword({
      email,
      password,
    })

    const { data, error } = (await Promise.race([loginPromise, timeoutPromise])) as any

    if (error) {
      console.error("Signin error:", error)
      return { data: null, error }
    }

    console.log("Signin successful:", data.user?.email)
    return { data, error: null }
  } catch (error: any) {
    console.error("Signin error:", error)
    return {
      data: null,
      error: { message: error.message || "An unexpected error occurred during signin" },
    }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Signout error:", error)
      return { error }
    }
    return { error: null }
  } catch (error) {
    console.error("Signout error:", error)
    return { error }
  }
}
