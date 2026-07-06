import type { ResolverResult } from './types';

const ENDPOINT = 'https://graphql.anilist.co';
const MIN_DELAY_MS = 500;
const MAX_RETRIES = 3;
let lastCall = 0;

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastCall;
  if (elapsed < MIN_DELAY_MS) await delay(MIN_DELAY_MS - elapsed);
  lastCall = Date.now();
}

const QUERY = `
query ($search: String, $seasonYear: Int) {
  Page(perPage: 5) {
    media(search: $search, type: ANIME, seasonYear: $seasonYear, format_in: [TV, TV_SHORT, MOVIE, OVA, ONA, SPECIAL]) {
      id
      title { romaji english native }
      coverImage { large extraLarge }
      externalLinks { url site type }
    }
  }
}`;

let circuitOpen = false;
let circuitOpenedAt = 0;
const CIRCUIT_COOLDOWN_MS = 60_000;
const CIRCUIT_THRESHOLD = 3;
let consecutiveFailures = 0;

function circuitAvailable(): boolean {
  if (!circuitOpen) return true;
  if (Date.now() - circuitOpenedAt > CIRCUIT_COOLDOWN_MS) {
    circuitOpen = false;
    consecutiveFailures = 0;
    return true;
  }
  return false;
}

function recordSuccess(): void {
  consecutiveFailures = 0;
  circuitOpen = false;
}

function recordFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
    circuitOpen = true;
    circuitOpenedAt = Date.now();
  }
}

async function fetchWithRetry(query: string, variables: Record<string, unknown>): Promise<any> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await throttle();
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      if (res.status === 429 || res.status === 403) {
        await delay(2000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
      const json = await res.json();
      if (json?.errors) throw new Error(`AniList error: ${json.errors[0]?.message ?? 'unknown'}`);
      recordSuccess();
      return json;
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) { recordFailure(); throw err; }
      await delay(500 * Math.pow(2, attempt));
    }
  }
  recordFailure();
  throw new Error('AniList exhausted retries');
}

function pickStreamingLink(media: any): string | null {
  const links: any[] = media.externalLinks || [];
  const streaming = links.find((l) => l.type === 'STREAMING');
  if (streaming) return streaming.url;
  const info = links.find((l) => l.type === 'INFO');
  if (info) return info.url;
  if (links.length > 0) return links[0].url;
  return null;
}

export async function resolveByAnilist(
  title: string,
  seasonYear?: number,
): Promise<ResolverResult | null> {
  if (!circuitAvailable()) return null;
  try {
    let json = await fetchWithRetry(QUERY, { search: title, seasonYear: seasonYear ?? null });
    let mediaList: any[] = json?.data?.Page?.media ?? [];
    if (mediaList.length === 0 && seasonYear) {
      if (!circuitAvailable()) return null;
      json = await fetchWithRetry(QUERY, { search: title, seasonYear: null });
      mediaList = json?.data?.Page?.media ?? [];
    }
    if (mediaList.length === 0) return null;
    const media = mediaList[0];
    const coverUrl = media.coverImage?.large ?? media.coverImage?.extraLarge ?? null;
    const resolvedUrl = pickStreamingLink(media);
    return {
      anilistId: media.id,
      resolvedUrl,
      coverUrl,
      source: 'anilist',
    };
  } catch {
    return null;
  }
}

export async function resolveByAnilistId(id: number): Promise<ResolverResult | null> {
  if (!circuitAvailable()) return null;
  const ID_QUERY = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        coverImage { large extraLarge }
        externalLinks { url site type }
      }
    }`;
  try {
    const json = await fetchWithRetry(ID_QUERY, { id });
    const media = json?.data?.Media;
    if (!media) return null;
    const coverUrl = media.coverImage?.large ?? media.coverImage?.extraLarge ?? null;
    const resolvedUrl = pickStreamingLink(media);
    return { anilistId: media.id, resolvedUrl, coverUrl, source: 'anilist' };
  } catch {
    return null;
  }
}