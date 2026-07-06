import fs from 'node:fs';
import { parseBoardFile } from '../src/lib/parseBoard';

const cache = JSON.parse(fs.readFileSync('.cache/enrichment.json', 'utf8'));
const board = parseBoardFile('boards/Summer 2026.md', fs);
const allShows = board.categories.flatMap(c => c.shows);

const crunchyHidive = allShows.filter(s => {
  const e = cache[s.slug];
  return e && (e.resolvedUrl.includes('crunchyroll.com/') || e.resolvedUrl.includes('hidive.com/'));
});

console.log(`Checking ${crunchyHidive.length} Crunchyroll/HIDIVE URLs...`);
for (const s of crunchyHidive) {
  console.log(`${s.slug}\t${cache[s.slug].resolvedUrl}`);
}