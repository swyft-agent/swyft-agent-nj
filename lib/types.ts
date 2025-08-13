// User and Authentication Types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  user_type: "agent" | "landlord" | "property_manager"
  company_id?: string
  created_at: string
  updated_at: string
}

export interface CompanyAccount {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  subscription_plan: "free" | "basic" | "premium" | "enterprise"
  subscription_status: "active" | "inactive" | "trial" | "cancelled"
  created_at: string
  updated_at: string
}

// Property Types
export interface Building {
  id: string
  name: string
  address: string
  city: string
  county: string
  description?: string
  total_units: number
  occupied_units: number
  vacant_units: number
  property_type: "apartment" | "house" | "commercial" | "mixed"
  amenities?: string[]
  images?: string[]
  latitude?: number
  longitude?: number
  company_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  building_id: string
  unit_number: string
  unit_type: "studio" | "1br" | "2br" | "3br" | "4br+" | "commercial"
  bedrooms: number
  bathrooms: number
  square_feet?: number
  rent_amount: number
  deposit_amount?: number
  status: "vacant" | "occupied" | "maintenance" | "reserved"
  description?: string
  amenities?: string[]
  images?: string[]
  available_from?: string
  lease_term?: number
  utilities_included?: string[]
  pet_policy?: "allowed" | "not_allowed" | "case_by_case"
  parking_included?: boolean
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface VacantUnit {
  id: string
  unit_id: string
  building_id: string
  rent_amount: number
  deposit_amount?: number
  available_from: string
  lease_term?: number
  description?: string
  amenities?: string[]
  images?: string[]
  utilities_included?: string[]
  pet_policy?: "allowed" | "not_allowed" | "case_by_case"
  parking_included?: boolean
  is_featured: boolean
  status: "available" | "pending" | "rented"
  views_count: number
  inquiries_count: number
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string

  // Joined data
  unit?: Unit
  building?: Building
}

// Tenant Types
export interface Tenant {
  id: string
  full_name: string
  email: string
  phone: string
  national_id?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  unit_id: string
  building_id: string
  lease_start_date: string
  lease_end_date: string
  rent_amount: number
  deposit_amount?: number
  status: "active" | "inactive" | "pending" | "terminated"
  move_in_date?: string
  move_out_date?: string
  notes?: string
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string

  // Joined data
  unit?: Unit
  building?: Building
}

// Communication Types
export interface Inquiry {
  id: string
  full_name: string
  email: string
  phone: string
  message: string
  inquiry_type: "viewing" | "rental" | "general" | "complaint"
  status: "new" | "responded" | "closed" | "spam"
  priority: "low" | "medium" | "high" | "urgent"
  source: "website" | "phone" | "email" | "whatsapp" | "social_media" | "referral"
  unit_id?: string
  building_id?: string
  vacant_unit_id?: string
  response?: string
  responded_at?: string
  responded_by?: string
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string

  // Joined data
  unit?: Unit
  building?: Building
  vacant_unit?: VacantUnit
}

export interface Notice {
  id: string
  title: string
  content: string
  notice_type: "move_in" | "move_out" | "rent_increase" | "maintenance" | "violation" | "general"
  status: "draft" | "sent" | "delivered" | "acknowledged"
  tenant_id?: string
  unit_id?: string
  building_id?: string
  due_date?: string
  sent_at?: string
  delivered_at?: string
  acknowledged_at?: string
  company_id: string
  user_id: string
  created_at: string
  updated_at: string

  // Joined data
  tenant?: Tenant
  unit?: Unit
  building?: Building
}

// Financial Types
export interface Transaction {
  id: string
  type: "income" | "expense"
  category: "rent" | "deposit" | "maintenance" | "utilities" | "advertising" | "management" | "other"
  amount: number
  description: string
  transaction_date: string
  payment_method?: "cash" | "mpesa" | "bank_transfer" | "cheque" | "card"
  reference_number?: string
  tenant_id?: string
  unit_id?: string
  building_id?: string
  receipt_url?: string
  status: "pending" | "completed" | "failed" | "cancelled"
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string

  // Joined data
  tenant?: Tenant
  unit?: Unit
  building?: Building
}

export interface Wallet {
  id: string
  balance: number
  currency: "KES"
  last_topup_amount?: number
  last_topup_date?: string
  total_spent: number
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

// Marketing Types
export interface Ad {
  id: string
  title: string
  description: string
  vacant_unit_id: string
  platform: "facebook" | "instagram" | "google" | "website" | "whatsapp"
  status: "draft" | "active" | "paused" | "completed" | "cancelled"
  budget: number
  spent_amount: number
  start_date: string
  end_date?: string
  target_audience?: {
    age_range?: string
    location?: string
    interests?: string[]
  }
  performance_metrics?: {
    impressions: number
    clicks: number
    leads: number
    cost_per_click: number
    conversion_rate: number
  }
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string

  // Joined data
  vacant_unit?: VacantUnit
}

export interface ClickTracking {
  id: string
  ad_id?: string
  vacant_unit_id?: string
  source: string
  user_agent?: string
  ip_address?: string
  referrer?: string
  location?: {
    city?: string
    country?: string
  }
  clicked_at: string
}

// File Upload Types
export interface Upload {
  id: string
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  file_url: string
  upload_type: "property_image" | "unit_image" | "document" | "receipt" | "avatar" | "other"
  entity_type?: "building" | "unit" | "tenant" | "transaction" | "user"
  entity_id?: string
  ai_analysis?: {
    description?: string
    tags?: string[]
    extracted_text?: string
  }
  company_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

// Settings Types
export interface Settings {
  id: string
  setting_key: string
  setting_value: any
  setting_type: "user" | "company" | "system"
  description?: string
  company_id?: string
  user_id?: string
  created_at: string
  updated_at: string
}

// Dashboard and Analytics Types
export interface DashboardStats {
  total_buildings: number
  total_units: number
  occupied_units: number
  vacant_units: number
  total_tenants: number
  monthly_revenue: number
  pending_inquiries: number
  active_ads: number
  occupancy_rate: number
  average_rent: number
}

export interface RevenueData {
  month: string
  revenue: number
  expenses: number
  profit: number
}

export interface OccupancyData {
  month: string
  occupied: number
  vacant: number
  occupancy_rate: number
}

export interface InquiryData {
  date: string
  inquiries: number
  responses: number
  response_rate: number
}

// Form Types
export interface CreateBuildingForm {
  name: string
  address: string
  city: string
  county: string
  description?: string
  property_type: "apartment" | "house" | "commercial" | "mixed"
  total_units: number
  amenities?: string[]
  latitude?: number
  longitude?: number
}

export interface CreateUnitForm {
  building_id: string
  unit_number: string
  unit_type: "studio" | "1br" | "2br" | "3br" | "4br+" | "commercial"
  bedrooms: number
  bathrooms: number
  square_feet?: number
  rent_amount: number
  deposit_amount?: number
  description?: string
  amenities?: string[]
  available_from?: string
  lease_term?: number
  utilities_included?: string[]
  pet_policy?: "allowed" | "not_allowed" | "case_by_case"
  parking_included?: boolean
}

export interface CreateTenantForm {
  full_name: string
  email: string
  phone: string
  national_id?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  unit_id: string
  lease_start_date: string
  lease_end_date: string
  rent_amount: number
  deposit_amount?: number
  move_in_date?: string
  notes?: string
}

export interface CreateInquiryForm {
  full_name: string
  email: string
  phone: string
  message: string
  inquiry_type: "viewing" | "rental" | "general" | "complaint"
  unit_id?: string
  building_id?: string
  vacant_unit_id?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Filter and Search Types
export interface PropertyFilters {
  city?: string
  county?: string
  property_type?: string
  min_rent?: number
  max_rent?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  available_from?: string
  pet_friendly?: boolean
  parking_included?: boolean
}

export interface InquiryFilters {
  status?: string
  inquiry_type?: string
  priority?: string
  source?: string
  date_from?: string
  date_to?: string
  building_id?: string
  unit_id?: string
}

export interface TenantFilters {
  status?: string
  building_id?: string
  lease_expiring_soon?: boolean
  overdue_rent?: boolean
}

// Utility Types
export type UserType = "agent" | "landlord" | "property_manager"
export type SubscriptionPlan = "free" | "basic" | "premium" | "enterprise"
export type PropertyType = "apartment" | "house" | "commercial" | "mixed"
export type UnitType = "studio" | "1br" | "2br" | "3br" | "4br+" | "commercial"
export type UnitStatus = "vacant" | "occupied" | "maintenance" | "reserved"
export type TenantStatus = "active" | "inactive" | "pending" | "terminated"
export type InquiryStatus = "new" | "responded" | "closed" | "spam"
export type InquiryType = "viewing" | "rental" | "general" | "complaint"
export type Priority = "low" | "medium" | "high" | "urgent"
export type NoticeType = "move_in" | "move_out" | "rent_increase" | "maintenance" | "violation" | "general"
export type TransactionType = "income" | "expense"
export type PaymentMethod = "cash" | "mpesa" | "bank_transfer" | "cheque" | "card"
export type AdPlatform = "facebook" | "instagram" | "google" | "website" | "whatsapp"
export type AdStatus = "draft" | "active" | "paused" | "completed" | "cancelled"
