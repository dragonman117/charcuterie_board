## MODIFIED Requirements

### Requirement: Cover art downloaded and stored locally as WebP
The system SHALL download each resolved cover image and store it at `/public/covers/<season-slug>/<show-slug>.webp`. The enrichment cache entry's `coverPath` SHALL point to this local path. Shows with no cover SHALL have `coverPath: null`.

When a show ends resolution without a cover — no cache entry, a cache entry without a `coverPath`, or live resolution returning none — the enricher SHALL check for a committed cover file at `public/covers/<season-slug>/<show-slug>.webp` and use it if present, so that a build run without any enrichment cache (e.g. a CI checkout) still renders every committed cover. A cover file committed to the repository SHALL be sufficient to render that show's cover regardless of API or cache state. Placeholder covers are reserved for shows with no committed cover file.

#### Scenario: Cover downloaded successfully
- **WHEN** the enricher resolves a `coverUrl` for a show
- **THEN** the image is fetched, converted to WebP, written to `/public/covers/<slug>.webp`, and `coverPath` is set to `/covers/<slug>.webp`

#### Scenario: Cover fetch fails
- **WHEN** the cover image download fails or times out
- **THEN** `coverPath` is set to null and the build continues; the renderer uses a placeholder cover

#### Scenario: Cache-less build with committed covers
- **WHEN** a build runs with no enrichment cache present (fresh checkout, no `.cache/`) and a show's cover file exists at `public/covers/<season-slug>/<show-slug>.webp` but the live APIs resolve no cover
- **THEN** the show's card renders the committed cover image, not a placeholder

#### Scenario: No cache and no committed cover
- **WHEN** a cache-less build resolves neither a live cover nor finds a committed cover file for a show
- **THEN** the card renders the placeholder cover and the build succeeds

### Requirement: Cover backfill for shows missing cover art
For shows whose cover remains null after the AniList and Jikan resolution (e.g. not-yet-announced titles), the project SHALL provide a backfill path that accepts an externally sourced cover image URL (found via web search, e.g. the TinyFish MCP tooling) and stores it through the same local WebP pipeline as automatic covers. The backfill result SHALL be recorded in the season's cache (including the override source) so rebuilds do not re-fetch it. Backfill is a build-time/manual step; the deployed site SHALL have no runtime dependency on it. The backfill path SHALL warn when the stored cover file is not tracked in version control, so uncommitted covers are noticed before they are pushed and deployed.

#### Scenario: Cover found via manual backfill
- **WHEN** a Fall 2026 show resolves no cover from AniList or Jikan and a cover URL is supplied via the backfill path
- **THEN** the image is downloaded, converted to WebP, stored at `/covers/<season-slug>-<show-slug>.webp` (or an otherwise collision-free local path), and the show's card renders the local cover

#### Scenario: No cover available at all
- **WHEN** no API match and no backfill URL exists for a show
- **THEN** the card renders the category-colored placeholder cover, the build succeeds, and the show is not retried on every rebuild (cached as unresolved for the season)

#### Scenario: Backfilled cover not committed
- **WHEN** the backfill path stores a cover file that is not tracked by version control
- **THEN** the backfill output includes a warning telling the contributor to commit the cover file, and the build still records the cover in the cache