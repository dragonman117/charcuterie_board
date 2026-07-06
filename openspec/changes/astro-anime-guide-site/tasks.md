## 1. Project Scaffolding

- [x] 1.1 Initialize Astro project at repo root (`npm create astro@latest -- --template minimal --no-install --no-git --typescript strict`), yielding `package.json`, `astro.config.mjs`, `tsconfig.json`, `/src/pages/index.astro`
- [x] 1.2 Add dependencies: `astro`, `marked` (for any inline MD needs), `sharp` (WebP conversion, used via Astro's image pipeline or directly)
- [x] 1.3 Configure `astro.config.mjs`: `output: 'static'`, `base: import.meta.env.BASE_PATH ?? '/'`, `site` from env, trailing slash behavior
- [x] 1.4 Create `.gitignore` entries for `node_modules/`, `dist/`, `/.cache/`
- [x] 1.5 Add `npm run dev`, `npm run build`, `npm run preview` scripts; verify `npm run build` produces `dist/` with a placeholder page

## 2. Board Parser (`guide-parser` capability)

- [x] 2.1 Create `src/lib/parseBoard.ts` with the `ParsedBoard` and `ParsedShow` TypeScript interfaces (seasonTitle, metadata, categories[], shows[] with title/rawUrl/blurb/markers/unresolved)
- [x] 2.2 Implement H1 title + italic metadata line extraction
- [x] 2.3 Implement `## Category` section splitting (any H2 name accepted, source order preserved)
- [x] 2.4 Implement `- **Title**` bullet parsing with trailing `*(marker)*` extraction into `markers` array
- [x] 2.5 Implement indented URL line + indented blurb binding (tolerant of missing URL or missing blurb)
- [x] 2.6 Implement placeholder URL detection (Crunchyroll `GDKHZEJPQ`, Netflix placeholder IDs `THUNDER3`/`THE_RIBBON_HERO`/`POKEMON_HORIZONS`) → set `unresolved: true`
- [x] 2.7 Write `src/lib/__tests__/parseBoard.test.ts` (or a runnable smoke script) covering: well-formed file, missing URL, missing blurb, markers, extra blank lines, renamed category, placeholder detection
- [x] 2.8 Run parser against `boards/Summer 2026.md` and confirm ~50 shows across 10 categories with no throw

## 3. Show Enrichment (`show-enrichment` capability)

- [x] 3.1 Create `src/lib/enrich/types.ts` (`EnrichedShow`, `CacheEntry` interfaces)
- [x] 3.2 Create `src/lib/enrich/anilist.ts`: GraphQL query by title + season year, return `{ anilistId, resolvedUrl (from external links), coverUrl (coverImage.large), source: 'anilist' }` with 500ms min delay + 3-retry exponential backoff
- [x] 3.3 Create `src/lib/enrich/jikan.ts`: REST query by title as fallback, return `{ resolvedUrl, coverUrl (large_image_url), source: 'jikan', anilistId: null }` with 350ms min delay + retries
- [x] 3.4 Create `src/lib/enrich/cache.ts`: load/save `/.cache/enrichment.json`, keyed by show slug; support `overrideAnilistId` field; respect `--fresh` flag (via env var or CLI arg)
- [x] 3.5 Create `src/lib/enrich/cover.ts`: download cover URL, convert to WebP via sharp, write to `/public/covers/<slug>.webp`, return local path `/covers/<slug>.webp`; on failure return null
- [x] 3.6 Create `src/lib/enrich/index.ts` orchestrator: for each parsed show, check cache → else AniList → else Jikan → else unresolved (search fallback URL); download cover; write cache; never throw
- [x] 3.7 Implement search fallback URL builder: Crunchyroll shows → `https://www.crunchyroll.com/search?q=<title>`, others → `https://www.google.com/search?q=<title>+anime+summer+2026`
- [x] 3.8 Smoke-test enrichment against 3 shows from `boards/Summer 2026.md` (one known good, one placeholder Crunchyroll, one Netflix) and inspect `/.cache/enrichment.json` + `/public/covers/`
- [x] 3.9 Run full enrichment against all ~50 shows; confirm no throws and cache file populated

## 4. Site Rendering (`site-rendering` capability)

- [x] 4.1 Create `src/components/ShowCard.astro`: cover (or category-colored placeholder), title, blurb, link (resolved or "Link TBA" search fallback), "Continuing"/"Movie" badges
- [x] 4.2 Create `src/components/CategorySection.astro`: H2 with anchor id, grid of `ShowCard`s, responsive 1→2→3 column via CSS grid + media queries
- [x] 4.3 Create `src/components/CategoryNav.astro`: sticky top nav listing categories in source order, anchor links, optional scroll-spy via small inline script
- [x] 4.4 Create `src/components/QuickStats.astro`: computed counts (total shows, per-service counts from URLs) + the board's original `## QUICK STATS` prose
- [x] 4.5 Create `src/components/Layout.astro`: HTML shell, mobile-first meta viewport, base-path-aware asset links, minimal zero-JS CSS
- [x] 4.6 Rewrite `src/pages/index.astro`: parse board → enrich → render Layout with CategoryNav, all CategorySections, QuickStats footer
- [x] 4.7 Wire build-time data flow: `parseBoard('boards/Summer 2026.md')` → `enrich(parsed)` → pass to page as props
- [x] 4.8 Add mobile-first CSS (typography scale, card padding, tap targets ≥ 44px, no horizontal scroll at 375px)
- [x] 4.9 Verify `npm run build` produces self-contained `dist/` with all covers under `dist/covers/` and no runtime external requests
- [x] 4.10 Verify `npm run dev` locally at 375px, 768px, and 1280px widths

## 5. GitHub Pages Deployment (`pages-deploy` capability)

- [x] 5.1 Create `.github/workflows/deploy.yml`: trigger on push to `main` + `workflow_dispatch`; permissions `pages: write` + `id-token: write`
- [x] 5.2 Add job: `actions/checkout@v4` → `actions/setup-node@v4` (Node 20) → `npm ci` → `npm run build` with `BASE_PATH` env from a workflow input (default `/<repo-name>/`)
- [x] 5.3 Add upload step: `actions/upload-pages-artifact@v3` with `path: dist/`
- [x] 5.4 Add deploy step: `actions/deploy-pages@v4`
- [x] 5.5 Add a dedicated `deploy` environment in the workflow and a placeholder for `BASE_PATH` input (so custom-domain users can set `/`)
- [x] 5.6 Document in a top-level `README.md` (or `DEPLOY.md`): how to set Pages source to GitHub Actions, how to set `BASE_PATH` for project vs. custom domain

## 6. Local Validation & Polish

- [x] 6.1 Run `npm run build` clean and inspect `dist/` (HTML, CSS, covers, no broken links)
- [x] 6.2 Run `npm run preview` and click through all categories at mobile + desktop widths
- [x] 6.3 Verify unresolved shows render "Link TBA" + search fallback, not broken links
- [x] 6.4 Verify cover placeholders render for any show where cover fetch failed
- [x] 6.5 Spot-check 5 enriched shows: confirm resolved URL is correct and cover matches the show (no wrong-show mismatches)
- [x] 6.6 Confirm `boards/Summer 2026.md` is byte-for-byte unchanged after a full build
- [x] 6.7 Hand the user the local `dist/` + `npm run preview` for validation before they wire up the Google repo