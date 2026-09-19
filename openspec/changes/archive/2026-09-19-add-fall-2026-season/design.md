## Context

The site is a static Astro build (changes `astro-anime-guide-site` + `dark-mode-mobile-nav`, applied): `src/pages/index.astro` hardcodes `boards/Summer 2026.md`, parses it with `src/lib/parseBoard.ts`, enriches at build time via AniList → Jikan (`src/lib/enrich/`), caches everything in a single flat `.cache/enrichment.json` keyed by show slug, stores covers as `public/covers/<slug>.webp`, and renders one page with category nav / cards / quick stats. The Vercel-style dark tokens and mobile hamburger are in place. Deploy is GitHub Pages via `.github/workflows/deploy.yml`; `BASE_PATH` is env-configurable; output is static with no runtime requests.

The Fall 2026 board lives at `/Users/dragonman117/agents/Koda/Anime Lists/Fall 2026.md` (~60 shows, many placeholder `GDKHZEJPQ` Crunchyroll IDs / "TBD" streams, plus Disney+, Prime Video, and Netflix links). The user wants it copied into `boards/`, rendered as the current season, Summer 2026 kept browsable, and covers pulled for shows the API pipeline misses using TinyFish.

Constraints: boards are read-only at build; build must never fail on unresolved shows; no runtime external requests; no new runtime JS frameworks; covers committed as WebP.

## Goals / Non-Goals

**Goals:**
- Multi-season routing derived from `boards/*.md`: `/<season-slug>/` per board, index at `/`, season switcher in the header.
- Season-scoped enrichment cache with one-time migration of the existing Summer cache; season-aware AniList season term and search fallbacks.
- Fall 2026 board in-repo, fully enriched (URLs + covers where resolvable), with a documented TinyFish-assisted backfill step for covers AniList/Jikan miss.
- Collision-free cover filenames across seasons (Summer and Fall share continuing-show slugs).
- Keep the existing single-page visual language per season; index page in the same token style.

**Non-Goals:**
- No pagination, search, or filtering per season.
- No per-season themes or layouts; all season pages share the existing component set.
- No TinyFish integration into the build itself — cover backfill is an interactive/manual assist feeding the normal pipeline (the deployed site stays self-contained).
- No change to the board Markdown format, parser contract, or deploy workflow.
- No RSS/scheduling; newest-season detection is build-time derivation.

## Decisions

### D1: Copy the Fall board into `boards/` as the repo source of truth
**Choice:** Copy `Fall 2026.md` verbatim into `boards/` now; from then on the repo copy is canonical (the Koda list is upstream inspiration, not a build input).
**Why:** The build must never depend on files outside the repo, and the board format already matches the parser exactly (same heading/bullet/URL/blurb conventions, including `*(continuing)`-style markers and parenthetical titles like `*(movie)*`).
**Alternatives:** Symlink or build-time read of the Koda path (fragile outside this machine, breaks CI); reformat the board (breaks the "human-edited Markdown is the source of truth" contract).

### D2: `getStaticPaths` over `boards/*.md`; `src/pages/[season].astro` becomes the season page; `index.astro` becomes the index
**Choice:** A small season-discovery helper (`src/lib/seasons.ts`) lists `boards/*.md`, parses each file's H1 + metadata, and derives: `slug` (e.g. `fall-2026`), `title`, `season` term (FALL), `year` (2026), and a sortable date (season term + year; WINTER=0, SPRING=1, SUMMER=2, FALL=3). `src/pages/[season].astro` uses `getStaticPaths()` from this helper and contains the existing parse → enrich → render logic; `src/pages/index.astro` renders the index (newest first, current = newest) and links to each season. URL = `/<slug>/` (trailing slash ignored per config).
**Why:** Zero hardcoding satisfies the season-routing spec; one dynamic route reuses the entire existing pipeline; Astro static output supports this natively.
**Alternatives:** One hardcoded page file per season (drifts, violates "add a board file → done"); runtime routing (not static); subdirectories like `/seasons/fall-2026/` (longer URLs, no benefit at this size).

### D3: Season-scoped cache: `.cache/enrichment/<season-slug>.json`, with one-time migration
**Choice:** Cache file becomes `.cache/enrichment/<season-slug>.json`. On load, if the legacy `.cache/enrichment.json` exists it is read once, written out as `summer-2026.json` (the only season the legacy cache could have belonged to), and the legacy file left in place (ignored thereafter; operator may delete). `loadCache`/`saveCache`/`getEntry`/`setEntry`/`getOverride` take a season-slug parameter; `enrichShows(shows, season)` threads it through. Covers become `public/covers/<season-slug>/<show-slug>.webp` served at `/covers/<season-slug>/<slug>.webp` — season-scoped filenames make cross-season slug collisions (continuing shows: `case-closed`, `one-piece`, `red-river`, `rilakkuma`, `beyblade-x`, …) impossible. The cover-downloader path change is transparent to components (they already consume `coverPath` verbatim).
**Why:** Continuing shows are exactly the shows most likely to collide, and a collision would silently swap covers/URLs between seasons. Season directories keep every existing behavior (commit covers, webp conversion) with a one-line path change.
**Alternatives:** Single keyed map `<season>:<slug>` (works, but forces a cache rewrite and makes per-season invalidation clumsy); prefix slugs only for colliding shows (conditional logic, easy to get wrong); keep flat covers (real collision risk — Summer's `case-closed.webp` would be overwritten by Fall's).

### D4: Season-aware resolver parameters; AniList `season: FALL`, Jikan unchanged
**Choice:** `resolveShow` gains `{ seasonTerm, seasonYear }` derived per board (e.g. FALL/2026 for `boards/Fall 2026.md`). The AniList query passes `season: $season, seasonYear: $year`; the current hardcoded `SEASON_YEAR = 2026` constant goes away. Jikan stays title-match-only (its season filter is unreliable for unaired shows). Search fallback gains the season word: `+anime+fall+2026` (lowercased season term), replacing the hardcoded `summer 2026`.
**Why:** Fall shows (most unaired at build time) match AniList's `Media(season: FALL, seasonYear: 2026)` list well, but a wrong season term would degrade match quality for exactly these borderline titles; the fallback needs the right season to produce useful search results.
**Alternatives:** Keep querying one fixed season (wrong matches for one of the two boards); derive from file mtime (nonsense); ask the user to annotate boards with season metadata (format change, rejected).

### D5: TinyFish cover backfill = manual override feeding the existing pipeline
**Choice:** During the apply phase, after `npm run enrich:fresh`, list shows with `coverPath: null` for the season. For each, use TinyFish search/fetch to find an official cover/key-visual image URL (AniList/MAL/official site), then record it in the season cache as a `coverOverrideUrl` on the show's entry (analogous to `overrideAnilistId`, which already exists). The enricher, when it finds `coverOverrideUrl` on a fresh run, downloads and stores it via `downloadAndStoreCover` and marks `source: "anilist"`-equivalent (`"override"` added to `EnrichmentSource`) — or, simpler: the apply step writes the cover directly by invoking a tiny script `scripts/backfill-cover.ts <season-slug> <show-slug> <url>` that calls `downloadAndStoreCover` and updates the cache entry. The spec requires only "a backfill path that accepts an externally sourced URL and stores it through the same pipeline"; the script is that path, and the TinyFish MCP is how the operator (agent) finds the URL — TinyFish is never a build dependency.
**Why:** Many Fall 2026 shows are unaired and absent from AniList/Jikan; their key visuals exist on official sites. The site stays self-contained (downloaded once, committed WebP). The manual-override pattern is already established (`overrideAnilistId`).
**Alternatives:** Generic web-scraping in the enricher (fragile, non-reproducible in CI, violates "no runtime requests" spirit during builds and adds nondeterminism); hotlinking found covers (breaks self-contained requirement); leaving placeholders (fails the user's explicit ask).
**Decision within the decision:** implement the `scripts/backfill-cover.ts` route (no new `EnrichmentSource`, no enricher changes beyond what D3/D4 require). It keeps the enricher untouched and the backfill explicitly manual.

### D6: Season switcher UI: native `<select>` (mobile) + pill links (desktop) in the header
**Choice:** `Layout.astro` accepts a `seasons` prop (`[{ slug, title, current: boolean }]`, plus `{ slug: '', title: 'All Seasons' }` for the index) and the current page's slug. Below 768px: a styled `<select>` with `onchange` navigation (tiny inline script, ~3 lines). At ≥ 768px: monospace pill links matching the category-nav style, active season emphasized. Placed in `.header-controls` next to the theme toggle.
**Why:** Reuses the existing dark-token pill language; a `<select>` is the smallest accessible control for 2+ seasons on mobile; no framework JS. Header grows by one compact control; no layout rework.
**Alternatives:** Put the switcher only on the index (dead-ends season pages); hamburger sub-menu (hidden, more JS); client-side router (rejected — static site, anchor/navigation is fine).

### D7: Season index page: minimal token-styled list, newest first
**Choice:** `index.astro` renders the site name/h1, then one section per season (newest first): display title, metadata line, show count, a "current" badge on the newest, and a link. Same tokens/typography; no covers required on the index (a tiny 4-cover mosaic could be added later — skip for now to avoid a second data dependency).
**Why:** The index is a directory, not a showcase; keeping it data-light means it can render from parse-only data (no enrichment) and stays fast.
**Alternatives:** Redirect `/` → newest season (hides the archive, worse UX); full hero per season (over-engineering).

### D8: QuickStats service detection extended
**Choice:** Add `disneyplus.com` → "Disney+" and `primevideo.com` (and existing amazon detection) → "Prime Video" to both `QuickStats.astro`'s counter and `enrich/index.ts`'s `detectService` (which drives card link labels). Keep detection URL-based exactly as today.
**Why:** Fall 2026 board contains Disney+ (`mission-yozakura-family`, Tokyo Revengers) and Prime Video (Seven Knights) links; without this they render as "Other"/generic "Watch".
**Alternatives:** Explicit service markers in the board format (format change, rejected); ignore (miscounted stats + generic labels).

## Risks / Trade-offs

- [Slug collisions across seasons] → Season-scoped covers (D3) and season-scoped cache keys make collisions structurally impossible; migration assigns the legacy cache to summer-2026.
- [Unaired Fall shows missing from AniList/Jikan → placeholder covers] → TinyFish backfill step (D5) during apply; anything still unresolved keeps the placeholder and the build stays green (existing spec requirement).
- [Placeholder `GDKHZEJPQ` Crunchyroll IDs for most Fall shows] → Existing placeholder-flagging already handles this (`unresolved` → search fallback); no new work, but expect many "Link TBA" cards until real URLs exist. `npm run enrich:fresh` re-picks them up later.
- [Build time grows ~2× with two boards enriching] → Cache makes steady-state rebuilds cheap; only the first Fall build pays full API cost. If needed, `ENRICH_FRESH=1` can be scoped per season later (not now).
- [Legacy cache migration mis-assigns a hypothetical non-Summer legacy cache] → The legacy cache only ever enriched `boards/Summer 2026.md` (the hardcoded board), so assignment to summer-2026 is safe by construction. Migration is copy-on-first-access; the legacy file is left intact as a backup.
- [AniList rate limits with ~60 new shows] → Existing 500ms delay + retries + Jikan fallback already carry this; worst case some Fall shows resolve on a later `enrich:fresh`.
- [Index page depends on parse-only data] → Intentional (D7); counts derive from parsing, which is synchronous and offline-safe.

## Migration Plan

1. Copy `Fall 2026.md` into `boards/` (verbatim).
2. Add `src/lib/seasons.ts` (discovery + slug/date derivation) and unit tests alongside the existing `parseBoard` tests.
3. Move season-page logic from `index.astro` to `src/pages/[season].astro` with `getStaticPaths`; rebuild `index.astro` as the season index.
4. Season-scope the cache (`.cache/enrichment/<season>.json` + migration) and cover paths (`/covers/<season>/<slug>.webp`); move existing committed Summer covers into `public/covers/summer-2026/` (git mv).
5. Parameterize the enricher (season term/year, fallback string); extend service detection.
6. Add the season switcher to `Layout.astro`; pass season context from both pages.
7. Add `scripts/backfill-cover.ts`.
8. `npm run enrich:fresh` → backfill missing Fall covers via TinyFish → verify build, preview at 375/768/1280, verify `/summer-2026/` still renders with migrated covers.
9. Commit covers + code; deploy as usual (no workflow change).

**Rollback:** Single git revert. Board file removal restores the old routing automatically (routes are derived). Cache is gitignored; cover dir move reverts with the code.

## Open Questions

- Should the index show a small cover mosaic per season (deferred; current decision: no — see D7).
- Whether `/summer-2026/` should eventually carry an "archived" visual state (deferred; current decision: no, all seasons render identically).
- How long to keep "Link TBA" re-resolution on the books — presumably a future `enrich:fresh` pass once Crunchyroll IDs go live (operational habit, not a code change).