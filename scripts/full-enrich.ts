import { parseBoardFile } from '../src/lib/parseBoard';
import { enrichShows } from '../src/lib/enrich/index';
import fs from 'node:fs';

async function main() {
  const board = parseBoardFile('boards/Summer 2026.md', fs);
  const allShows = board.categories.flatMap(c => c.shows);
  console.log(`Enriching ${allShows.length} shows across ${board.categories.length} categories...`);

  const start = Date.now();
  const enriched = await enrichShows(allShows);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const bySource = enriched.reduce((acc, e) => { acc[e.source] = (acc[e.source] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const withCover = enriched.filter(e => e.coverPath).length;

  console.log(`Done in ${elapsed}s`);
  console.log('By source:', JSON.stringify(bySource));
  console.log(`With cover: ${withCover}/${enriched.length}`);
  console.log('Sample resolved:');
  for (const e of enriched.slice(0, 5)) {
    console.log(`  [${e.source}] ${e.title} -> ${e.resolvedUrl}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });