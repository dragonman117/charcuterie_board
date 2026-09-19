## Why

The site currently renders only one hardcoded season (`boards/Summer 2026.md`), so each new season means editing code, and past seasons disappear. Fall 2026 is upon us with a fresh curated board, and the site needs to become a multi-season archive: the Fall 2026 board becomes the live page, Summer 2026 remains browsable at its own URL, and a season switcher (plus a home/landing entry point) ties them together.

## What Changes

- **New** board file: `boards/Fall 2026.md` (copied verbatim from `/Users/dragonman117/agents/Koda/Anime Lists/Fall 2026.md`, the human-edited source of truth) — ~60 shows across Isekai, Fantasy, Romance, Action, Drama, Slice of Life, Comedy, Sci-Fi, Sports, Horror/Thriller, and Other, many with placeholder Crunchyroll IDs (`GDKHZEJPQ`) or "TBD" streams.
- **New** season routing: one page per board at `/<season-slug>/` derived from the files in `boards/` (e.g. `/fall-2026/`, `/summer-2026/`). No season is hardcoded; pages are generated with `getStaticPaths`.
- **New** season index page at `/` listing every season (title, date metadata, show count, cover sample), newest season first. Fall 2026 is the "current" season.
- **New** season switcher in the header: a compact `<select>` (mobile) / pill links (desktop) linking to every season page.
- **Modified** `src/pages/index.astro`: becomes the season index; per-season rendering moves to a dynamic route (e.g. `src/pages/[season].astro`) reusing the existing parse → enrich → render pipeline unchanged.
- **Modified** enrichment pipeline: cover/URL resolution now runs per season with season-aware cache scoping (see below) and season-aware search fallbacks ("fall 2026" instead of hardcoded "summer 2026").
- **Modified** cache layout: `.cache/enrichment.json` becomes per-season (`.cache/enrichment/<season-slug>.json`, or a keyed `season:slug` structure) so Summer and Fall shows with colliding slugs (e.g. `case-closed`, continuing shows carried over from Summer) never cross-contaminate. Existing Summer cache entries are migrated, not dropped.
- **Modified** AniList resolver: season-year matching already targets 2026; the season term (FALL vs SUMMER) becomes a parameter so Fall shows query AniList's Fall 2026 season instead of Summer 2026.
- **New** cover art for all resolvable Fall 2026 shows, fetched via the existing build-time pipeline (AniList primary / Jikan fallback). Where both APIs fail to return a cover (e.g. not-yet-announced shows), the existing TinyFish-capable workflow fills gaps manually: a build script (`scripts/fetch-missing-covers.ts` or enrichment override) uses TinyFish search/fetch to find an official cover image URL for shows whose `coverPath` is null, then feeds it through the same WebP/local-store path. Unresolvable shows keep the category-colored placeholder (build never fails).
- **No breaking changes** to the board format, parser contract, deploy workflow, or design tokens. `boards/*.md` files remain read-only.

## Capabilities

### New Capabilities
- `season-routing`: One page per season board at `/<season-slug>/`, derived from `boards/*.md`, plus a season index at `/` and a header season switcher. Season order/newest is derived from board metadata (or filename), not hardcoded.

### Modified Capabilities
- `show-enrichment`: Cache becomes season-scoped (no slug collisions across seasons; Summer cache migrated) and the search-fallback / AniList season term becomes season-aware (currently hardcoded "summer 2026"). Plus a TinyFish-assisted cover backfill path for shows whose cover remains null after AniList + Jikan.
- `site-rendering`: The site renders multiple season pages plus a season index; header gains a season switcher; per-season pages keep the existing category nav, cards, quick stats, theme, and base-path behavior. Quick-stats/service-detection handles the new services appearing in Fall 2026 (Disney+, Prime Video).

## Impact

- **New data**: `boards/Fall 2026.md` (copied from the Koda agent list, then treated as repo source of truth).
- **Modified code**: `src/pages/index.astro` → season index; new `src/pages/[season].astro` (or equivalent dynamic route); `src/lib/enrich/index.ts` (season param, season-aware fallbacks); `src/lib/enrich/cache.ts` (per-season cache file); `src/lib/enrich/anilist.ts` (season term); `Layout.astro` (season switcher); `QuickStats.astro` (Disney+/Prime service detection).
- **New code**: season discovery helper (list `boards/*.md` → slug, title, date); optional TinyFish cover-backfill script under `scripts/`.
- **Assets**: `public/covers/` gains ~40–60 new WebP files for Fall 2026 shows (committed, as today).
- **Cache**: `.cache/enrichment.json` split per season (one-time migration; gitignored either way).
- **External calls**: same build-time-only APIs (AniList GraphQL, Jikan v4); TinyFish MCP used interactively/one-off for covers the APIs miss — not a runtime dependency.
- **Deploy**: unchanged GitHub Actions workflow; Pages now serves multiple routes (static, no config change).
- **Board files remain read-only** — the build never writes to `boards/`.