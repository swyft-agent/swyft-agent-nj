interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class LocalStorageCache {
  private prefix = "swyft_"

  set<T>(key: string, data: T, ttlMinutes = 30): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000, // Convert to milliseconds
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      console.warn("Failed to save to localStorage:", error)
    }
  }

  get<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.prefix + key)
      if (!stored) return null

      const item: CacheItem<T> = JSON.parse(stored)
      const now = Date.now()

      // Check if expired
      if (now - item.timestamp > item.ttl) {
        this.remove(key)
        return null
      }

      return item.data
    } catch (error) {
      console.warn("Failed to read from localStorage:", error)
      return null
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error)
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn("Failed to clear localStorage:", error)
    }
  }

  // Check if data exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null
  }
}

export const localCache = new LocalStorageCache()

// Cache keys
export const CACHE_KEYS = {
  BUILDINGS: "buildings",
  VACANT_UNITS: "vacant_units",
  INQUIRIES: "inquiries",
  NOTICES: "notices",
  DASHBOARD_STATS: "dashboard_stats",
  USER_PROFILE: "user_profile",
}

// Helper function to get cached data or fetch if not available
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  ttlMinutes = 30,
): Promise<T> {
  // Try to get from cache first
  const cached = localCache.get<T>(cacheKey)
  if (cached !== null) {
    console.log(`✅ Using cached data for ${cacheKey}`)
    return cached
  }

  // If not in cache, fetch the data
  console.log(`🔄 Fetching fresh data for ${cacheKey}`)
  try {
    const data = await fetchFunction()

    // Cache the result
    localCache.set(cacheKey, data, ttlMinutes)
    console.log(`💾 Cached data for ${cacheKey}`)

    return data
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${cacheKey}:`, error)
    throw error
  }
}
