import fs from 'node:fs';
import path from 'node:path';
import type { CacheEntry, CacheMap } from './types';

const CACHE_DIR = path.resolve(process.cwd(), '.cache');
const ENRICHMENT_DIR = path.join(CACHE_DIR, 'enrichment');
const LEGACY_CACHE_FILE = path.join(CACHE_DIR, 'enrichment.json');
const LEGACY_SEASON_SLUG = 'summer-2026';

export function isFresh(): boolean {
  return process.env.ENRICH_FRESH === '1';
}

function seasonCachePath(seasonSlug: string): string {
  return path.join(ENRICHMENT_DIR, `${seasonSlug}.json`);
}

function migrateLegacyCache(): void {
  try {
    if (!fs.existsSync(LEGACY_CACHE_FILE)) return;
    const target = seasonCachePath(LEGACY_SEASON_SLUG);
    if (fs.existsSync(target)) return;
    if (!fs.existsSync(ENRICHMENT_DIR)) fs.mkdirSync(ENRICHMENT_DIR, { recursive: true });
    fs.copyFileSync(LEGACY_CACHE_FILE, target);
  } catch (err) {
    console.warn(`[enrich.cache] legacy migration failed: ${(err as Error).message}`);
  }
}

export function loadCache(seasonSlug: string): CacheMap {
  try {
    migrateLegacyCache();
    const file = seasonCachePath(seasonSlug);
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

export function saveCache(seasonSlug: string, cache: CacheMap): void {
  try {
    if (!fs.existsSync(ENRICHMENT_DIR)) fs.mkdirSync(ENRICHMENT_DIR, { recursive: true });
    fs.writeFileSync(seasonCachePath(seasonSlug), JSON.stringify(cache, null, 2));
  } catch (err) {
    console.warn(`[enrich.cache] failed to save cache: ${(err as Error).message}`);
  }
}

export function getEntry(cache: CacheMap, slug: string): CacheEntry | undefined {
  return cache[slug];
}

export function setEntry(cache: CacheMap, slug: string, entry: CacheEntry): void {
  cache[slug] = entry;
}

export function getOverride(cache: CacheMap, slug: string): number | undefined {
  return cache[slug]?.overrideAnilistId;
}