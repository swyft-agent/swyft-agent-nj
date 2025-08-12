interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class AppCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace("*", ".*"))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

export const appCache = new AppCache()

export const CACHE_KEYS = {
  TENANTS: "tenants",
  BUILDINGS: "buildings",
  VACANT_UNITS: "vacant_units",
  INVOICES: "invoices",
  ANALYTICS: (companyId: string) => `analytics_${companyId}`,
  FINANCIALS: (companyId: string) => `financials_${companyId}`,
  USER_PROFILE: (userId: string) => `user_profile_${userId}`,
  COMPANY_DETAILS: (companyId: string) => `company_details_${companyId}`,
  COMPANY_USERS: (companyId: string) => `company_users_${companyId}`,
  TENANT_PROFILE: (tenantId: string) => `tenant_profile_${tenantId}`,
  PAYMENT_HISTORY: (tenantId: string) => `payment_history_${tenantId}`,
  ANALYTICS_DATA: "analytics_data",
  FINANCIAL_DATA: "financial_data",
}

export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 5 * 60 * 1000,
): Promise<T> {
  // Try to get from cache first
  const cached = appCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // If not in cache, fetch the data
  try {
    const data = await fetchFunction()
    appCache.set(key, data, ttl)
    return data
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error)
    throw error
  }
}

export function invalidateCache(key: string): void {
  appCache.invalidate(key)
}

export function invalidateCachePattern(pattern: string): void {
  appCache.invalidatePattern(pattern)
}
