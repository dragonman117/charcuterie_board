export type EnrichmentSource = 'anilist' | 'jikan' | 'unresolved';

export interface EnrichedShow {
  title: string;
  slug: string;
  rawUrl: string;
  blurb: string;
  markers: string[];
  unresolved: boolean;
  resolvedUrl: string;
  coverPath: string | null;
  anilistId: number | null;
  source: EnrichmentSource;
  resolvedAt: string;
}

export interface CacheEntry {
  resolvedUrl: string;
  coverPath: string | null;
  anilistId: number | null;
  source: EnrichmentSource;
  resolvedAt: string;
  overrideAnilistId?: number;
}

export type CacheMap = Record<string, CacheEntry>;

export interface ResolverResult {
  anilistId: number | null;
  resolvedUrl: string | null;
  coverUrl: string | null;
  source: EnrichmentSource;
}