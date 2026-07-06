import { parseBoardFile } from '../src/lib/parseBoard';
import { loadCache, saveCache } from '../src/lib/enrich/cache';
import { downloadAndStoreCover } from '../src/lib/enrich/cover';
import fs from 'node:fs';

interface KitsuAnime {
  id: string;
  type: string;
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

function buildDirectUrl(title: string, rawUrl: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-season-\d+.*$/, '')
    .replace(/-part-\d+.*$/, '')
    .replace(/-recapture-arc.*$/, '');

  if (rawUrl.includes('crunchyroll.com')) {
    return `https://www.crunchyroll.com/${slug}`;
  }
  if (rawUrl.includes('hidive.com')) {
    return `https://www.hidive.com/tv/${slug}`;
  }
  if (rawUrl.includes('netflix.com')) {
    const netflixMatch = rawUrl.match(/netflix\.com\/title\/(\d+)/);
    if (netflixMatch) return `https://www.netflix.com/title/${netflixMatch[1]}`;
    return `https://www.netflix.com/search?q=${encodeURIComponent(title)}`;
  }
  return rawUrl;
}

async function main() {
  const board = parseBoardFile('boards/Summer 2026.md', fs);
  const allShows = board.categories.flatMap(c => c.shows);
  console.log(`Re-enriching ${allShows.length} shows with direct URLs + Kitsu covers...`);

  const cache = loadCache();
  let updated = 0;
  let coversAdded = 0;

  for (const show of allShows) {
    const entry = cache[show.slug];
    if (!entry) {
      console.log(`[skip] ${show.title} - no cache entry`);
      continue;
    }

    const directUrl = buildDirectUrl(show.title, show.rawUrl);
    const urlChanged = directUrl !== entry.resolvedUrl;

    let coverPath = entry.coverPath;
    if (!coverPath) {
      console.log(`[cover] ${show.title}`);
      const kitsu = await searchKitsu(show.title);
      if (kitsu) {
        const coverUrl = kitsu.attributes.posterImage?.large ?? kitsu.attributes.coverImage?.large ?? null;
        if (coverUrl) {
          coverPath = await downloadAndStoreCover(coverUrl, show.slug);
          if (coverPath) coversAdded++;
        }
      }
    }

    if (urlChanged || coverPath !== entry.coverPath) {
      cache[show.slug] = {
        ...entry,
        resolvedUrl: directUrl,
        coverPath,
        resolvedAt: new Date().toISOString(),
      };
      updated++;
      console.log(`  -> ${directUrl}${coverPath ? ` | cover: ${coverPath}` : ''}`);
    }
  }

  saveCache(cache);
  console.log(`\nDone. Updated ${updated} entries, added ${coversAdded} covers.`);
  const withCover = Object.values(cache).filter(e => e.coverPath).length;
  const total = Object.keys(cache).length;
  console.log(`Covers: ${withCover}/${total}`);
}

main().catch(e => { console.error(e); process.exit(1); });