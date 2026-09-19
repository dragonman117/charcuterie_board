## 1. Board data

- [x] 1.1 Copy `/Users/dragonman117/agents/Koda/Anime Lists/Fall 2026.md` verbatim into `boards/Fall 2026.md` and confirm `parseBoard` parses it (60+ shows, categories, quick stats, no throw) with a scratch test or console run
- [x] 1.2 Verify the Fall board's format quirks survive parsing: `*(continuing)` / `*(movie)` markers, parenthetical alt-titles in `**bold**` bullets, shows with no URL line ("TBD" entries), and the `GDKHZEJPQ` placeholder URLs flag as `unresolved`

## 2. Season discovery (`season-routing` capability)

- [x] 2.1 Create `src/lib/seasons.ts`: enumerate `boards/*.md`, parse H1 + metadata line, derive per season `{ slug, title, seasonTerm, seasonYear, sortKey }` (WINTER<SPRING<SUMMER<FALL within a year; newest first ordering), and export `getSeasons()` + `getCurrentSeason()`
- [x] 2.2 Add unit tests for `seasons.ts` next to `parseBoard.test.ts` (slug derivation `Fall 2026 Anime Guide` → `fall-2026`, ordering across seasons/years, single-season case)
- [x] 2.3 Confirm board files are only ever read, never written (no code path opens them for write)

## 3. Season-scoped cache + covers (`show-enrichment` capability)

- [x] 3.1 Change cache layout to `.cache/enrichment/<season-slug>.json`: thread a `seasonSlug` param through `loadCache`/`saveCache`/`getEntry`/`setEntry`/`getOverride` in `src/lib/enrich/cache.ts`
- [x] 3.2 Add one-time migration in `cache.ts`: if legacy `.cache/enrichment.json` exists and no `summer-2026.json` does, copy it to `.cache/enrichment/summer-2026.json` (leave the legacy file in place)
- [x] 3.3 Season-scope cover storage: `downloadAndStoreCover(coverUrl, seasonSlug, showSlug)` writes `public/covers/<season-slug>/<show-slug>.webp` and returns `/covers/<season-slug>/<show-slug>.webp`
- [x] 3.4 `git mv` existing committed Summer covers from `public/covers/*.webp` into `public/covers/summer-2026/` and verify `/summer-2026/` page still resolves every `coverPath`
- [x] 3.5 Re-point existing unit tests / fix any test fixtures referencing flat cover paths

## 4. Season-aware enrichment (`show-enrichment` capability)

- [x] 4.1 Replace `SEASON_YEAR` constant: `enrichShows(shows, season)` takes `{ slug, seasonTerm, seasonYear }` and `resolveByAnilist` queries AniList with `season: FALL|SUMMER|...`, `seasonYear` from the board
- [x] 4.2 Make `searchFallbackUrl` take the season term: generic fallback becomes `google.com/search?q=<title>+anime+<season>-<year>` (e.g. `fall-2026`), replacing the hardcoded `summer 2026`
- [x] 4.3 Add `disneyplus.com` → "Disney+" and `primevideo.com`/amazon video → "Prime Video" to `detectService` in `src/lib/enrich/index.ts` and to the per-service counter in `QuickStats.astro`
- [x] 4.4 Create `scripts/backfill-cover.ts <season-slug> <show-slug> <image-url>`: downloads via `downloadAndStoreCover`, writes `coverPath` into the season cache entry, and prints the shows still missing covers for that season
- [x] 4.5 Verify build never fails with both APIs unreachable for the Fall board (all unresolved → placeholders + search links)

## 5. Routing + pages (`season-routing` + `site-rendering` capabilities)

- [x] 5.1 Move the season-page logic (parse → enrich → render, category nav, quick stats) from `src/pages/index.astro` into `src/pages/[season].astro` with `getStaticPaths()` driven by `getSeasons()`; URL `/<season-slug>/`
- [x] 5.2 Rebuild `src/pages/index.astro` as the season index: newest first, current badge on newest, per-season title + metadata + show count + link (parse-only data, no enrichment)
- [x] 5.3 Add the season switcher to `Layout.astro` via a `seasons` prop: `<select>` navigation < 768px (tiny inline script), monospace pill links ≥ 768px, active season marked; pass season context from both pages
- [x] 5.4 Verify all internal links honor `BASE_PATH` (index ↔ season pages, switcher links, cover paths) with `BASE_PATH=/charcuterie_board/` and unset

## 6. Fall enrichment + TinyFish cover backfill (`show-enrichment` capability)

- [x] 6.1 Run `npm run enrich:fresh` and capture the list of Fall shows with `coverPath: null` (expected: unaired/TBD titles like From Far Away, Dragon Ball Super: Beerus, Cyberpunk: Edgerunners 2, Fool Night, TANK CHAIR, Kyoufu Collector, Sgt. Frog 2026, DANDIVINE, Seven Knights, etc.)
- [x] 6.2 For each missing cover, use TinyFish (search + fetch_content) to locate an official cover/key-visual image URL (AniList CDN, MAL, official site, press kit), then run `scripts/backfill-cover.ts fall-2026 <show-slug> <url>`; prefer landscape key visuals cropped to the existing cover aspect treatment
- [x] 6.3 Re-run build and confirm every backfilled cover renders locally as WebP under `/covers/fall-2026/`; shows with genuinely no findable art keep the category-colored placeholder
- [x] 6.4 Spot-check resolved URLs/labels: Disney+ shows (Tokyo Revengers, Yozakura) labeled "Disney+", Seven Knights labeled "Prime Video", Netflix titles labeled "Netflix", and placeholder-ID Crunchyroll shows render "Link TBA" + search fallback (note: Tokyo Revengers & Seven Knights have no board URL lines, so they render "Link TBA" + Google fallback per the unresolved path — Yozakura confirmed "Disney+" with its real board URL; 5 Netflix labels and 27 "Link TBA" render on `/fall-2026/`)

## 7. Verification + deploy readiness

- [x] 7.1 `npm run build` clean; `npm run preview` at 375px / 768px / 1280px: index, `/fall-2026/` (current, switcher active), `/summer-2026/` intact with migrated covers, dark/light theme still works
- [x] 7.2 Run unit tests (seasons + parseBoard) — all green
- [x] 7.3 Confirm `boards/*.md` byte-identical after full build (both files)
- [x] 7.4 Confirm no runtime external requests: covers served locally, links are user-clicked navigations only
- [x] 7.5 Verify GitHub Pages deploy unchanged: multi-route static output (`/`, `/fall-2026/`, `/summer-2026/`) works under the workflow's `BASE_PATH`
- [x] 7.6 Update README: multi-season structure (boards/*.md, season pages, index, switcher), backfill script usage, per-season cache/covers layout