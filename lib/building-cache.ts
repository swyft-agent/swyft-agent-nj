// Building cache utility for fast loading
interface CachedBuilding {
  id: string
  name: string
  address: string
  city: string
  building_type: string
  total_units: number
  floors?: number
  status: string
  created_at: string
}

interface BuildingCache {
  buildings: CachedBuilding[]
  company_account_id: string
  timestamp: number
  expires_at: number
}

const CACHE_KEY = "swyft_buildings_cache"
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export class BuildingCacheManager {
  static setCache(buildings: CachedBuilding[], companyId: string) {
    const cache: BuildingCache = {
      buildings,
      company_account_id: companyId,
      timestamp: Date.now(),
      expires_at: Date.now() + CACHE_DURATION,
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      console.log("✅ Buildings cached:", buildings.length, "buildings")
      console.log("💾 Caching buildings:", {
        count: buildings.length,
        companyId,
        expiresAt: new Date(Date.now() + CACHE_DURATION).toISOString(),
      })
    } catch (error) {
      console.warn("Failed to cache buildings:", error)
    }
  }

  static getCache(companyId: string): CachedBuilding[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const cache: BuildingCache = JSON.parse(cached)

      console.log("🔍 Cache check:", {
        found: !!cached,
        expired: cached ? Date.now() > cache.expires_at : false,
        companyMatch: cached ? cache.company_account_id === companyId : false,
      })

      // Check if cache is expired
      if (Date.now() > cache.expires_at) {
        console.log("🕒 Building cache expired, will refresh")
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      // Check if cache is for the right company
      if (cache.company_account_id !== companyId) {
        console.log("🏢 Different company, clearing cache")
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      console.log("⚡ Using cached buildings:", cache.buildings.length, "buildings")
      return cache.buildings
    } catch (error) {
      console.warn("Failed to read building cache:", error)
      localStorage.removeItem(CACHE_KEY)
      return null
    }
  }

  static clearCache() {
    localStorage.removeItem(CACHE_KEY)
    console.log("🗑️ Building cache cleared")
  }

  static invalidateCache() {
    // Mark cache as expired but don't remove it (for offline fallback)
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const cache: BuildingCache = JSON.parse(cached)
        cache.expires_at = Date.now() - 1 // Mark as expired
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      }
    } catch (error) {
      console.warn("Failed to invalidate cache:", error)
    }
  }
}
