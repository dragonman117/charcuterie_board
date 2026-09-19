## ADDED Requirements

### Requirement: Resolve show to canonical streaming URL and cover art
The system SHALL, for each parsed show, attempt to resolve a canonical streaming URL and a cover art image URL by querying AniList GraphQL first, and falling back to Jikan v4 REST if AniList returns no match. The resolved data SHALL include: `resolvedUrl`, `coverUrl` (remote source), `anilistId` (when found), `source` (`"anilist"` | `"jikan"` | `"unresolved"`).

#### Scenario: AniList match found
- **WHEN** the enricher queries AniList by title and season year and receives a match with external streaming links
- **THEN** `resolvedUrl` is set to the first matching streaming link, `coverUrl` to the AniList `coverImage.large` URL, `source` to `"anilist"`, and `anilistId` to the AniList ID

#### Scenario: AniList miss, Jikan match
- **WHEN** AniList returns no match and Jikan returns a match by title
- **THEN** `resolvedUrl` is set from Jikan's external links if present (else the show's MyAnimeList page), `coverUrl` to Jikan's `images.jpg.large_image_url`, `source` to `"jikan"`, and `anilistId` is null

#### Scenario: No match from either source
- **WHEN** both AniList and Jikan return no match for a show
- **THEN** the show is marked `source: "unresolved"`, `resolvedUrl` is set to a search URL of the form `https://www.crunchyroll.com/search?q=<encoded-title>` (or a generic search fallback for non-Crunchyroll shows), and `coverUrl` is null

### Requirement: Build never fails on enrichment failure
The enrichment step SHALL NOT throw or abort the build when a show cannot be resolved. Unresolved shows SHALL render with a "link TBA" state and a category-colored placeholder cover.

#### Scenario: All enrichment sources unreachable
- **WHEN** both AniList and Jikan are unreachable during a fresh build (no cache)
- **THEN** every show is marked `source: "unresolved"`, the build completes successfully, and the rendered site shows placeholder covers and search-fallback links

### Requirement: Persistent local enrichment cache
The system SHALL persist enrichment results to `/.cache/enrichment.json` keyed by show slug. Each entry SHALL record `{ resolvedUrl, coverPath, anilistId, source, resolvedAt }`. Subsequent builds SHALL reuse cached entries unless the cache is invalidated.

#### Scenario: Rebuild reuses cache
- **WHEN** a build runs and `/.cache/enrichment.json` already contains an entry for a show slug
- **THEN** the enricher returns the cached entry without calling AniList or Jikan

#### Scenario: Cache invalidation via --fresh
- **WHEN** the build is invoked with `--fresh` (or the cache file is deleted)
- **THEN** the enricher re-resolves every show from live APIs and overwrites the cache

### Requirement: Cover art downloaded and stored locally as WebP
The system SHALL download each resolved cover image and store it at `/public/covers/<slug>.webp`. The enrichment cache entry's `coverPath` SHALL point to this local path. Shows with no cover SHALL have `coverPath: null`.

#### Scenario: Cover downloaded successfully
- **WHEN** the enricher resolves a `coverUrl` for a show
- **THEN** the image is fetched, converted to WebP, written to `/public/covers/<slug>.webp`, and `coverPath` is set to `/covers/<slug>.webp`

#### Scenario: Cover fetch fails
- **WHEN** the cover image download fails or times out
- **THEN** `coverPath` is set to null and the build continues; the renderer uses a placeholder cover

### Requirement: Manual override of matched show
The system SHALL support a manual override in `/.cache/enrichment.json` via an `overrideAnilistId` field on a cache entry. When present, the enricher SHALL query AniList with that ID directly and skip title-based matching.

#### Scenario: Override present
- **WHEN** a cache entry contains `overrideAnilistId: 12345`
- **THEN** the enricher fetches AniList ID 12345 directly and uses its data, ignoring title-matching

### Requirement: Rate limiting and retries
The enricher SHALL enforce a minimum delay between API calls (configurable, default 500ms for AniList, 350ms for Jikan) and SHALL retry failed requests up to 3 times with exponential backoff before marking a show unresolved.

#### Scenario: Transient API failure
- **WHEN** an AniList request fails with a 5xx or network error
- **THEN** the enricher retries up to 3 times with backoff before falling back to Jikan or marking unresolved