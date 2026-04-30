import { ModuleContent } from '../types';

const CACHE_PREFIX = 'ailearning_module_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  module: ModuleContent;
  cachedAt: number;
}

export function buildModuleCacheKey(
  departmentId: string,
  level: string,
  index: number,
  profileId: string
): string {
  return `${departmentId}_${level}_${index}_${profileId}`;
}

export function getCachedModule(key: string): ModuleContent | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.module;
  } catch {
    return null;
  }
}

export function setCachedModule(key: string, module: ModuleContent): void {
  try {
    const entry: CacheEntry = { module, cachedAt: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Module cache write failed (storage full?):', e);
  }
}

export function getCacheStats(): { count: number; sizeKB: number } {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  let totalSize = 0;
  keys.forEach(k => { totalSize += (localStorage.getItem(k) || '').length; });
  return { count: keys.length, sizeKB: Math.round(totalSize / 1024) };
}

export function clearAllModuleCache(): void {
  Object.keys(localStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
