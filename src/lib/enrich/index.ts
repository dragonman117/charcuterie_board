import type { ParsedShow } from '../parseBoard';
import type { EnrichedShow, CacheEntry, CacheMap, ResolverResult } from './types';
import { isPlaceholderUrl } from '../parseBoard';
import { resolveByAnilist, resolveByAnilistId } from './anilist';
import { resolveByJikan } from './jikan';
import { loadCache, saveCache, getEntry, setEntry, getOverride, isFresh } from './cache';
import { downloadAndStoreCover } from './cover';

const SEASON_YEAR = 2026;

function hasValidBoardUrl(show: ParsedShow): boolean {
  return Boolean(show.rawUrl) && !show.unresolved && !isPlaceholderUrl(show.rawUrl);
}

function searchFallbackUrl(title: string, rawUrl: string): string {
  const enc = encodeURIComponent(title);
  if (rawUrl.includes('crunchyroll.com')) {
    return `https://www.crunchyroll.com/search?q=${enc}`;
  }
  if (rawUrl.includes('hidive.com')) {
    return `https://www.hidive.com/search?q=${enc}`;
  }
  if (rawUrl.includes('netflix.com')) {
    return `https://www.netflix.com/search?q=${enc}`;
  }
  if (rawUrl.includes('amazon.com') || rawUrl.includes('primevideo.com')) {
    return `https://www.amazon.com/s?k=${enc}`;
  }
  return `https://www.google.com/search?q=${enc}+anime+summer+2026`;
}

function detectService(url: string): string | null {
  if (url.includes('crunchyroll.com')) return 'Crunchyroll';
  if (url.includes('hidive.com')) return 'HIDIVE';
  if (url.includes('netflix.com')) return 'Netflix';
  if (url.includes('amazon.com') || url.includes('primevideo.com')) return 'Amazon Prime';
  if (url.includes('aniplus')) return 'ANIPLUS';
  if (url.includes('myanimelist.net')) return 'MyAnimeList';
  return null;
}

async function resolveShow(
  show: ParsedShow,
  overrideId?: number,
): Promise<ResolverResult> {
  if (overrideId) {
    const r = await resolveByAnilistId(overrideId);
    if (r) return r;
  }
  const al = await resolveByAnilist(stripSeasonSuffix(show.title), SEASON_YEAR);
  if (al) return al;
  const jk = await resolveByJikan(stripSeasonSuffix(show.title));
  if (jk) return jk;
  return { anilistId: null, resolvedUrl: null, coverUrl: null, source: 'unresolved' };
}

function stripSeasonSuffix(title: string): string {
  return title
    .replace(/\s+Season\s+\d+.*$/i, '')
    .replace(/\s+Part\s+\d+.*$/i, '')
    .replace(/\s+\(Recapture Arc\).*$/i, '')
    .trim();
}

export async function enrichShows(shows: ParsedShow[]): Promise<EnrichedShow[]> {
  const cache = isFresh() ? {} : loadCache();
  const results: EnrichedShow[] = new Array(shows.length);
  let completed = 0;
  const CONCURRENCY = 3;
  let cursor = 0;

  async function worker() {
    while (cursor < shows.length) {
      const i = cursor++;
      const show = shows[i];
      const overrideId = getOverride(cache, show.slug);
      const cached = !isFresh() ? getEntry(cache, show.slug) : undefined;

      let resolvedUrl: string;
      let coverPath: string | null;
      let anilistId: number | null;
      let source: EnrichedShow['source'];

      const validBoardUrl = hasValidBoardUrl(show);

      if (cached && !isFresh() && cached.source !== 'unresolved') {
        if (validBoardUrl) {
          resolvedUrl = show.rawUrl;
          source = 'jikan';
        } else {
          resolvedUrl = cached.resolvedUrl;
          source = cached.source;
        }
        coverPath = cached.coverPath;
        anilistId = cached.anilistId;
      } else {
        try {
          const r = await resolveShow(show, overrideId);
          if (validBoardUrl) {
            resolvedUrl = show.rawUrl;
            source = 'jikan';
          } else if (r.source === 'unresolved' || !r.resolvedUrl) {
            resolvedUrl = searchFallbackUrl(show.title, show.rawUrl);
            source = 'unresolved';
          } else {
            resolvedUrl = r.resolvedUrl;
            source = r.source;
          }
          coverPath = r.coverUrl ? await downloadAndStoreCover(r.coverUrl, show.slug) : (cached?.coverPath ?? null);
          anilistId = r.anilistId;
        } catch {
          if (validBoardUrl) {
            resolvedUrl = show.rawUrl;
            source = 'jikan';
          } else {
            resolvedUrl = searchFallbackUrl(show.title, show.rawUrl);
            source = 'unresolved';
          }
          coverPath = cached?.coverPath ?? null;
          anilistId = null;
        }

        const entry: CacheEntry = {
          resolvedUrl,
          coverPath,
          anilistId,
          source,
          resolvedAt: new Date().toISOString(),
        };
        if (overrideId) entry.overrideAnilistId = overrideId;
        setEntry(cache, show.slug, entry);
        completed++;
        if (completed % 5 === 0) saveCache(cache);
      }

      results[i] = {
        title: show.title,
        slug: show.slug,
        rawUrl: show.rawUrl,
        blurb: show.blurb,
        markers: show.markers,
        unresolved: source === 'unresolved',
        resolvedUrl,
        coverPath,
        anilistId,
        source,
        resolvedAt: new Date().toISOString(),
      };
    }
  }

  const workers: Promise<void>[] = [];
  for (let w = 0; w < CONCURRENCY; w++) workers.push(worker());
  await Promise.all(workers);

  saveCache(cache);
  return results;
}

export function serviceLabel(show: EnrichedShow): string {
  const svc = detectService(show.resolvedUrl) ?? detectService(show.rawUrl);
  if (svc) return svc;
  if (show.source === 'unresolved') return 'Link TBA';
  return 'Watch';
}