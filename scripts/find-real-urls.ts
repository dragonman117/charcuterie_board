import fs from 'node:fs';
import { parseBoardFile } from '../src/lib/parseBoard';
import { loadCache, saveCache } from '../src/lib/enrich/cache';

const board = parseBoardFile('boards/Summer 2026.md', fs);
const allShows = board.categories.flatMap(c => c.shows);
const cache = loadCache();

const MIN_DELAY = 2000;
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

async function searchDDG(query: string): Promise<string[]> {
  await throttle();
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    });
    if (!r.ok) return [];
    const html = await r.text();
    const urls: string[] = [];
    const re = /uddg=([^&"']+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      urls.push(decodeURIComponent(m[1]));
    }
    return urls;
  } catch { return []; }
}

function findCrunchyrollSeriesUrl(urls: string[]): string | null {
  for (const u of urls) {
    const match = u.match(/https?:\/\/www\.crunchyroll\.com\/series\/[A-Z0-9]+\/[a-z0-9-]+/i);
    if (match) return match[0];
  }
  return null;
}

function findHidiveUrl(urls: string[]): string | null {
  for (const u of urls) {
    if (u.includes('hidive.com/tv/')) return u.split('?')[0].split('#')[0];
  }
  return null;
}

async function main() {
  const needsLookup = allShows.filter(s => {
    const e = cache[s.slug];
    if (!e) return false;
    if (e.resolvedUrl.includes('crunchyroll.com/') && !e.resolvedUrl.includes('/series/')) return true;
    if (e.resolvedUrl.includes('hidive.com/tv/')) return true;
    return false;
  });

  console.log(`Looking up ${needsLookup.length} shows...`);
  let found = 0;
  let failed = 0;

  for (const show of needsLookup) {
    const title = cleanTitle(show.title);
    const isHidive = cache[show.slug].resolvedUrl.includes('hidive.com');
    const site = isHidive ? 'hidive.com' : 'crunchyroll.com';
    const query = `site:${site} ${title}`;
    console.log(`[${show.slug}] ${query}`);

    const urls = await searchDDG(query);
    let realUrl: string | null = null;
    if (isHidive) {
      realUrl = findHidiveUrl(urls);
    } else {
      realUrl = findCrunchyrollSeriesUrl(urls);
    }

    if (realUrl) {
      cache[show.slug].resolvedUrl = realUrl;
      cache[show.slug].source = 'jikan';
      found++;
      console.log(`  -> ${realUrl}`);
    } else {
      console.log(`  NOT FOUND in ${urls.length} results`);
      if (urls.length > 0) console.log(`  sample: ${urls.slice(0,3).join(' | ')}`);
      failed++;
    }
    saveCache(cache);
  }

  console.log(`\nFound: ${found}, Failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });