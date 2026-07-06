import { parseBoardFile } from '../src/lib/parseBoard';
import { loadCache, saveCache } from '../src/lib/enrich/cache';
import fs from 'node:fs';

function buildDirectUrl(title: string, rawUrl: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-season-\d+.*$/, '')
    .replace(/-part-\d+.*$/, '')
    .replace(/-recapture-arc.*$/, '')
    .replace(/-2026-tv-series.*$/, '')
    .replace(/-starting.*$/, '');

  if (rawUrl.includes('crunchyroll.com')) return `https://www.crunchyroll.com/${slug}`;
  if (rawUrl.includes('hidive.com')) return `https://www.hidive.com/tv/${slug}`;
  if (rawUrl.includes('netflix.com')) {
    const m = rawUrl.match(/netflix\.com\/title\/(\d+)/);
    if (m) return `https://www.netflix.com/title/${m[1]}`;
    return `https://www.netflix.com/search?q=${encodeURIComponent(title)}`;
  }
  return rawUrl;
}

async function main() {
  const board = parseBoardFile('boards/Summer 2026.md', fs);
  const allShows = board.categories.flatMap(c => c.shows);
  const cache = loadCache();

  let fixed = 0;
  for (const show of allShows) {
    const entry = cache[show.slug];
    if (!entry) continue;
    const directUrl = buildDirectUrl(show.title, show.rawUrl);
    const isSearch = directUrl.includes('/search?q=');
    cache[show.slug] = {
      ...entry,
      resolvedUrl: directUrl,
      source: isSearch ? 'unresolved' : 'jikan',
      resolvedAt: new Date().toISOString(),
    };
    fixed++;
  }

  saveCache(cache);
  console.log(`Fixed ${fixed} entries.`);
  const search = Object.values(cache).filter(e => e.resolvedUrl.includes('/search')).length;
  const direct = Object.values(cache).filter(e => !e.resolvedUrl.includes('/search')).length;
  console.log(`Direct URLs: ${direct}, Search fallbacks: ${search}`);
}

main();