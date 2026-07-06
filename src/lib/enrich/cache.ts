import fs from 'node:fs';
import path from 'node:path';
import type { CacheEntry, CacheMap } from './types';

const CACHE_DIR = path.resolve(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'enrichment.json');

export function isFresh(): boolean {
  return process.env.ENRICH_FRESH === '1';
}

export function loadCache(): CacheMap {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

export function saveCache(cache: CacheMap): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
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