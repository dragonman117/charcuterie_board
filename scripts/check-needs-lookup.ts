import fs from 'node:fs';
import { parseBoardFile } from '../src/lib/parseBoard';
import { loadCache, saveCache } from '../src/lib/enrich/cache';

const board = parseBoardFile('boards/Summer 2026.md', fs);
const allShows = board.categories.flatMap(c => c.shows);
const cache = loadCache();

const needsLookup = allShows.filter(s => {
  const e = cache[s.slug];
  if (!e) return false;
  return e.resolvedUrl.includes('crunchyroll.com/') && !e.resolvedUrl.includes('/series/');
});

console.log(`Need to find real URLs for ${needsLookup.length} Crunchyroll shows`);
for (const s of needsLookup) {
  console.log(s.slug);
}