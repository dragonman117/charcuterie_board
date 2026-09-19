## ADDED Requirements

### Requirement: Season-scoped enrichment cache
The enrichment cache SHALL be scoped per season so that shows with identical slugs across seasons (e.g. continuing shows carried over, or same-titled entries) never share or overwrite each other's entries. Each season's entries SHALL be stored under a key or file that includes the season slug. Existing single-file cache entries from Summer 2026 SHALL be migrated to the Summer scope on first access, not dropped.

#### Scenario: Same slug in two seasons
- **WHEN** Summer 2026 and Fall 2026 both contain a show with slug `case-closed` and each resolves differently
- **THEN** each season resolves and caches independently; rebuilding one season does not use or overwrite the other's entry

#### Scenario: Migration of existing cache
- **WHEN** a build runs with a pre-existing `.cache/enrichment.json` from the single-season era
- **THEN** its entries are treated as Summer 2026 entries (migrated into the season-scoped store) and subsequent builds continue to reuse them without re-fetching

### Requirement: Season-aware search fallback
The search-fallback URL for unresolved shows SHALL embed the show's own season name (e.g. `+anime+fall+2026`) instead of a hardcoded season string, so the generic fallback stays useful on every season page.

#### Scenario: Unresolved Fall show
- **WHEN** a Fall 2026 show has no valid board URL and no API match
- **THEN** its generic fallback link is `https://www.google.com/search?q=<title>+anime+fall+2026`

### Requirement: Season-aware AniList query
When resolving a show against AniList, the enricher SHALL query using the show's season term (e.g. FALL) and season year derived from the board being built, not a globally hardcoded season. Jikan title matching remains season-agnostic.

#### Scenario: Fall board resolution
- **WHEN** the Fall 2026 board is enriched and a title is searched on AniList
- **THEN** the query targets the Fall 2026 season (season: FALL, seasonYear: 2026)

### Requirement: Cover backfill for shows missing cover art
For shows whose cover remains null after the AniList and Jikan resolution (e.g. not-yet-announced titles), the project SHALL provide a backfill path that accepts an externally sourced cover image URL (found via web search, e.g. the TinyFish MCP tooling) and stores it through the same local WebP pipeline as automatic covers. The backfill result SHALL be recorded in the season's cache (including the override source) so rebuilds do not re-fetch it. Backfill is a build-time/manual step; the deployed site SHALL have no runtime dependency on it.

#### Scenario: Cover found via manual backfill
- **WHEN** a Fall 2026 show resolves no cover from AniList or Jikan and a cover URL is supplied via the backfill path
- **THEN** the image is downloaded, converted to WebP, stored at `/covers/<season-slug>-<show-slug>.webp` (or an otherwise collision-free local path), and the show's card renders the local cover

#### Scenario: No cover available at all
- **WHEN** no API match and no backfill URL exists for a show
- **THEN** the card renders the category-colored placeholder cover, the build succeeds, and the show is not retried on every rebuild (cached as unresolved for the season)