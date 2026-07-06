import { parseBoardFile } from '../src/lib/parseBoard';
import { loadCache, saveCache } from '../src/lib/enrich/cache';
import { downloadAndStoreCover } from '../src/lib/enrich/cover';
import fs from 'node:fs';

interface KitsuAnime {
  id: string;
  attributes: {
    canonicalTitle: string;
    slug: string;
    posterImage: { large: string; original: string } | null;
    coverImage: { large: string; original: string } | null;
  };
}

const MIN_DELAY = 250;
let lastCall = 0;
async function throttle() {
  const elapsed = Date.now() - lastCall;
  if (elapsed < MIN_DELAY) await new Promise(r => setTimeout(r, MIN_DELAY - elapsed));
  lastCall = Date.now();
}

async function searchKitsu(title: string): Promise<KitsuAnime | null> {
  const cleanTitle = title
    .replace(/\s+Season\s+\d+.*$/i, '')
    .replace(/\s+Part\s+\d+.*$/i, '')
    .replace(/\s+\(Recapture Arc\).*$/i, '')
    .replace(/-Starting.*$/i, '')
    .replace(/\s+\(2026 TV Series\).*$/i, '')
    .replace(/\s+\(movie\).*$/i, '')
    .trim();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await throttle();
      const r = await fetch(`https://kitsu.app/api/edge/anime?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=3`);
      if (r.status === 429) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
      if (!r.ok) { console.warn(`  kitsu ${r.status}`); continue; }
      const j = await r.json() as { data: KitsuAnime[] };
      return j.data?.[0] ?? null;
    } catch (e) {
      console.warn(`  kitsu err: ${(e as Error).message}`);
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

async function main() {
  const board = parseBoardFile('boards/Summer 2026.md', fs);
  const allShows = board.categories.flatMap(c => c.shows);
  const cache = loadCache();

  let coversAdded = 0;
  let sourceFixed = 0;

  for (const show of allShows) {
    const entry = cache[show.slug];
    if (!entry) continue;

    // Fix source: if we now have a direct URL (not a search fallback), mark as resolved
    const isSearchFallback = entry.resolvedUrl.includes('/search?q=');
    if (entry.source === 'unresolved' && !isSearchFallback) {
      entry.source = 'jikan'; // we resolved it via direct URL construction + Kitsu
      sourceFixed++;
    }

    // Try to get missing covers from Kitsu
    if (!entry.coverPath) {
      console.log(`[cover] ${show.title}`);
      const kitsu = await searchKitsu(show.title);
      if (kitsu) {
        const coverUrl = kitsu.attributes.posterImage?.large ?? kitsu.attributes.coverImage?.large ?? null;
        if (coverUrl) {
          const cp = await downloadAndStoreCover(coverUrl, show.slug);
          if (cp) { entry.coverPath = cp; coversAdded++; }
        }
      }
    }
  }

  saveCache(cache);
  console.log(`\nDone. Fixed ${sourceFixed} sources, added ${coversAdded} covers.`);
  const withCover = Object.values(cache).filter(e => e.coverPath).length;
  const total = Object.keys(cache).length;
  console.log(`Covers: ${withCover}/${total}`);
}

main().catch(e => { console.error(e); process.exit(1); });