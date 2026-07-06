import type { ResolverResult } from './types';

const BASE = 'https://api.jikan.moe/v4';
const MIN_DELAY_MS = 350;
const MAX_RETRIES = 2;
let lastCall = 0;

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastCall;
  if (elapsed < MIN_DELAY_MS) await delay(MIN_DELAY_MS - elapsed);
  lastCall = Date.now();
}

async function fetchJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await throttle();
      const res = await fetch(url);
      if (res.status === 429) {
        await delay(1500 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`Jikan HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      await delay(400 * Math.pow(2, attempt));
    }
  }
  throw new Error('Jikan exhausted retries');
}

function pickExternalUrl(entry: any): string | null {
  const externals: any[] = entry?.external ?? [];
  const streaming = externals.find((e) => e?.name?.toLowerCase().includes('crunchyroll')) ??
    externals.find((e) => e?.name?.toLowerCase().includes('hidive')) ??
    externals.find((e) => e?.name?.toLowerCase().includes('netflix'));
  if (streaming?.url) return streaming.url;
  if (entry?.url) return entry.url;
  return null;
}

export async function resolveByJikan(title: string): Promise<ResolverResult | null> {
  try {
    const q = encodeURIComponent(title);
    const json = await fetchJson(`${BASE}/anime?q=${q}&limit=5&sfw=true`);
    const data: any[] = json?.data ?? [];
    if (data.length === 0) return null;
    const entry = data[0];
    const coverUrl = entry?.images?.jpg?.large_image_url ?? entry?.images?.webp?.large_image_url ?? null;
    const resolvedUrl = pickExternalUrl(entry);
    return {
      anilistId: null,
      resolvedUrl,
      coverUrl,
      source: 'jikan',
    };
  } catch {
    return null;
  }
}