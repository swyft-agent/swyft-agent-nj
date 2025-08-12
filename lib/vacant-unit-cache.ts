// Vacant unit cache utility for fast loading
interface CachedVacantUnit {
  id: string
  title: string
  unit_number: string
  building_id: string
  building_name?: string
  bedrooms: number
  bathrooms: number
  square_feet?: number
  rent_amount: number
  security_deposit?: number
  address: string
  city: string
  state: string
  zip_code: string
  images?: string[]
  amenities?: string[]
  available_date: string
  status: string
  created_at: string
}

interface VacantUnitCache {
  units: CachedVacantUnit[]
  company_account_id: string
  timestamp: number
  expires_at: number
}

const CACHE_KEY = "swyft_vacant_units_cache"
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes (shorter for more dynamic data)

export class VacantUnitCacheManager {
  static setCache(units: CachedVacantUnit[], companyId: string) {
    const cache: VacantUnitCache = {
      units,
      company_account_id: companyId,
      timestamp: Date.now(),
      expires_at: Date.now() + CACHE_DURATION,
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      console.log("✅ Vacant units cached:", units.length, "units")
    } catch (error) {
      console.warn("Failed to cache vacant units:", error)
    }
  }

  static getCache(companyId: string): CachedVacantUnit[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const cache: VacantUnitCache = JSON.parse(cached)

      // Check if cache is expired
      if (Date.now() > cache.expires_at) {
        console.log("🕒 Vacant units cache expired, will refresh")
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      // Check if cache is for the right company
      if (cache.company_account_id !== companyId) {
        console.log("🏢 Different company, clearing vacant units cache")
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      console.log("⚡ Using cached vacant units:", cache.units.length, "units")
      return cache.units
    } catch (error) {
      console.warn("Failed to read vacant units cache:", error)
      localStorage.removeItem(CACHE_KEY)
      return null
    }
  }

  static clearCache() {
    localStorage.removeItem(CACHE_KEY)
    console.log("🗑️ Vacant units cache cleared")
  }

  static invalidateCache() {
    // Mark cache as expired but don't remove it (for offline fallback)
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const cache: VacantUnitCache = JSON.parse(cached)
        cache.expires_at = Date.now() - 1 // Mark as expired
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      }
    } catch (error) {
      console.warn("Failed to invalidate vacant units cache:", error)
    }
  }
}
