import fs from 'node:fs';
import { parseBoardFile } from '../src/lib/parseBoard';
import { loadCache, saveCache } from '../src/lib/enrich/cache';

const board = parseBoardFile('boards/Summer 2026.md', fs);
const allShows = board.categories.flatMap(c => c.shows);
const cache = loadCache();

const MIN_DELAY = 1500;
let lastCall = 0;
async function throttle() {
  const elapsed = Date.now() - lastCall;
  if (elapsed < MIN_DELAY) await new Promise(r => setTimeout(r, MIN_DELAY - elapsed));
  lastCall = Date.now();
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s+Season\s+\d+.*$/i, '')
    .replace(/\s+Part\s+\d+.*$/i, '')
    .replace(/\s+\(Recapture Arc\).*$/i, '')
    .replace(/\s+\(continuing.*?\).*$/i, '')
    .replace(/\s+\(movie\).*$/i, '')
    .replace(/\s+\(2026 TV Series\).*$/i, '')
    .replace(/-Starting.*$/i, '')
    .trim();
}

async function bingSearch(query: string): Promise<string> {
  await throttle();
  const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!r.ok) return '';
    return await r.text();
  } catch { return ''; }
}

function extractCrunchyrollSeriesUrl(rss: string): string | null {
  const m = rss.match(/crunchyroll\.com\/series\/[A-Z0-9]+\/[a-z0-9-]+/i);
  return m ? `https://www.${m[0]}` : null;
}

function extractHidiveUrl(rss: string): string | null {
  const m = rss.match(/hidive\.com\/tv\/[a-z0-9-]+/i);
  return m ? `https://www.${m[0]}` : null;
}

async function main() {
  const needsLookup = allShows.filter(s => {
    const e = cache[s.slug];
    if (!e) return false;
    if (e.resolvedUrl.includes('crunchyroll.com/') && !e.resolvedUrl.includes('/series/')) return true;
    if (e.resolvedUrl.includes('hidive.com/tv/')) return true;
    return false;
  });

  console.log(`Looking up ${needsLookup.length} shows via Bing RSS...`);
  let found = 0;
  let failed = 0;
  const failedList: string[] = [];

  for (const show of needsLookup) {
    const title = cleanTitle(show.title);
    const isHidive = cache[show.slug].resolvedUrl.includes('hidive.com');
    const site = isHidive ? 'hidive.com/tv' : 'crunchyroll.com/series';
    const query = `site:${site} ${title}`;
    console.log(`[${show.slug}] ${query}`);

    const rss = await bingSearch(query);
    let realUrl: string | null = null;
    if (isHidive) {
      realUrl = extractHidiveUrl(rss);
    } else {
      realUrl = extractCrunchyrollSeriesUrl(rss);
    }

    if (realUrl) {
      cache[show.slug].resolvedUrl = realUrl;
      cache[show.slug].source = 'jikan';
      found++;
      console.log(`  -> ${realUrl}`);
    } else {
      console.log(`  NOT FOUND`);
      failedList.push(show.slug);
      failed++;
    }
    saveCache(cache);
  }

  console.log(`\nFound: ${found}, Failed: ${failed}`);
  if (failedList.length > 0) {
    console.log('\nFailed slugs:');
    for (const s of failedList) console.log(' ', s);
  }
}

main().catch(e => { console.error(e); process.exit(1); });