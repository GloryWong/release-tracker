// Simple in-memory cache with TTL (5 minutes)
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCached(key: string): any | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data
  }
  cache.delete(key)
  return null
}

export function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}
