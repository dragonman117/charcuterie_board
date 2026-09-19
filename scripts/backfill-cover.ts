import fs from 'node:fs';
import path from 'node:path';
import { parseBoardFile } from '../src/lib/parseBoard';
import { getSeasons } from '../src/lib/seasons';
import { loadCache, saveCache, setEntry } from '../src/lib/enrich/cache';
import { downloadAndStoreCover } from '../src/lib/enrich/cover';

function usage(): never {
  console.error('Usage: npx tsx scripts/backfill-cover.ts <season-slug> <show-slug> <image-url>');
  process.exit(1);
}

async function main() {
  const [seasonSlug, showSlug, imageUrl] = process.argv.slice(2);
  if (!seasonSlug || !showSlug || !imageUrl) usage();

  const seasons = getSeasons();
  const season = seasons.find((s) => s.slug === seasonSlug);
  if (!season) {
    console.error(`Unknown season "${seasonSlug}". Known: ${seasons.map((s) => s.slug).join(', ')}`);
    process.exit(1);
  }

  const board = parseBoardFile(season.boardPath, fs as unknown as { readFileSync(path: string, enc: string): string });
  const allShows = board.categories.flatMap((c) => c.shows);
  const show = allShows.find((s) => s.slug === showSlug);
  if (!show) {
    console.error(`Unknown show slug "${showSlug}" in ${seasonSlug}.`);
    process.exit(1);
  }

  console.log(`Downloading ${imageUrl} -> covers/${seasonSlug}/${showSlug}.webp`);
  const coverPath = await downloadAndStoreCover(imageUrl, seasonSlug, showSlug);
  if (!coverPath) {
    console.error('Download/conversion failed.');
    process.exit(1);
  }

  const cache = loadCache(seasonSlug);
  const existing = cache[showSlug];
  setEntry(cache, showSlug, {
    resolvedUrl: existing?.resolvedUrl ?? '',
    coverPath,
    anilistId: existing?.anilistId ?? null,
    source: existing?.source ?? 'unresolved',
    resolvedAt: new Date().toISOString(),
    ...(existing?.overrideAnilistId ? { overrideAnilistId: existing.overrideAnilistId } : {}),
  });
  saveCache(seasonSlug, cache);
  console.log(`coverPath recorded: ${coverPath}`);

  console.log(`\nShows still missing covers in ${seasonSlug}:`);
  const enriched = allShows.filter((s) => !loadCache(seasonSlug)[s.slug]?.coverPath);
  if (enriched.length === 0) console.log('  (none)');
  for (const s of enriched) console.log(`  ${s.slug} — ${s.title}`);
}

main();