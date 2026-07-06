import { parseBoardFile } from '../src/lib/parseBoard';
import { enrichShows } from '../src/lib/enrich/index';
import fs from 'node:fs';

async function main() {
  const board = parseBoardFile('boards/Summer 2026.md', fs);
  const isekai = board.categories[0];
  const fantasy = board.categories[1];
  const scifi = board.categories.find(c => c.name.startsWith('SCI-FI'))!;

  const picks = [
    isekai.shows[0],
    isekai.shows.find(s => s.title.includes('Tomb Raider'))!,
    scifi.shows[0],
  ];

  console.log('Smoke test picks:');
  for (const p of picks) console.log(' -', p.title, '| raw:', p.rawUrl);

  const enriched = await enrichShows(picks);
  console.log('\n--- Results ---');
  for (const e of enriched) {
    console.log('Title:', e.title);
    console.log('Source:', e.source);
    console.log('Resolved URL:', e.resolvedUrl);
    console.log('Cover:', e.coverPath);
    console.log('AniList ID:', e.anilistId);
    console.log('---');
  }

  const cacheRaw = fs.readFileSync('.cache/enrichment.json', 'utf8');
  console.log('Cache file present, bytes:', cacheRaw.length);
}

main().catch((err) => { console.error(err); process.exit(1); });