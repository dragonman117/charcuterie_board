## Context

The repo currently contains only `boards/Summer 2026.md` — a hand-edited Markdown anime guide with ~50 shows across 10 categories. Many Crunchyroll URLs use a placeholder series ID (`GDKHZEJPQ`), Netflix/HIDIVE links are partial, and there is no cover art. The goal is a static, mobile-first Astro site deployed to GitHub Pages, with the Markdown remaining the canonical human-edited source of truth. Real streaming URLs and cover art are resolved at build time only; the deployed site is fully self-contained.

Constraints:
- No runtime API calls or API keys in the deployed site.
- `boards/Summer 2026.md` is read-only at build time; humans keep editing it freely.
- Must build under GitHub Pages (static output, configurable `base` path).
- Build must not fail when a show can't be enriched — graceful fallback.

## Goals / Non-Goals

**Goals:**
- Parse `boards/<season>.md` into a structured show list without modifying the source.
- Resolve each show to a real streaming URL + cover art at build time (AniList primary, Jikan fallback), with a persistent local cache.
- Render a mobile-first static site with category navigation, show cards, and quick stats.
- Produce self-contained output (cover art committed under `/public/covers/`, no hotlinking).
- One-command local dev (`npm run dev`) and one-command build (`npm run build`).
- GitHub Actions workflow that builds and deploys to Pages, with `base` path driven by deployment env.

**Non-Goals:**
- No CMS, no database, no runtime backend.
- No user accounts, comments, or analytics.
- No multi-season archive UI in this change (single season page only; structure should allow future expansion but not build it).
- No automatic re-resolution of URLs on every commit — cache is reused until invalidated manually or by a `--fresh` flag.
- No editing UI for the Markdown.

## Decisions

### D1: Astro static site generator
**Choice:** Astro (static output, no SSR).
**Why:** Pure static HTML/CSS output deploys trivially to GitHub Pages. Astro's content collections + Markdown handling fit the source-of-truth file. Zero JS by default = fast on mobile.
**Alternatives:** Eleventy (less opinionated, more manual), Next.js static export (heavier, overkill), plain HTML (no component model). Astro gives components + zero-JS + first-class Markdown.

### D2: Custom Markdown parser over a generic frontmatter parser
**Choice:** A small custom parser (`src/lib/parseBoard.ts`) that tokenizes the specific board format: H1 title, italic metadata line, `---` separators, `## Category` headers, `- **Title**` bullets, indented URL line, indented blurb.
**Why:** The board format is stable but informal (no frontmatter, bullets with bold titles, optional `*(continuing)*` markers, optional `*(movie)*` markers). A generic MD parser would lose the title/URL/blurb binding.
**Alternatives:** `marked` tokens + post-processing (more brittle for the bullet structure), converting the file to frontmatter (breaks the human-editing contract).

### D3: AniList GraphQL primary, Jikan REST fallback
**Choice:** Query AniList GraphQL (`https://graphql.anilist.co`) by title + season year first; on failure/miss, fall back to Jikan v4 (`https://api.jikan.moe/v4/anime`) by title.
**Why:** AniList has cover images in multiple sizes, season metadata, and good title-alias matching. Jikan (MyAnimeList) is a reliable fallback with a different matching algorithm. Both are keyless.
**Alternatives:** Crunchyroll/HIDIVE/Netflix have no public APIs. LiveChart has no public API. AniList alone risks misses on obscure shows; Jikan alone has stricter rate limits (3 req/s).

### D4: Cover art cached locally as WebP under `/public/covers/<slug>.webp`
**Choice:** Download cover image at build time, convert/save as WebP, commit the derived files under `/public/covers/`.
**Why:** Self-contained deploy (no broken images if a CDN changes URL, no hotlinking ToS issues), WebP is small and widely supported, and GitHub Pages serves them as static assets.
**Alternatives:** Hotlink AniList CDN URLs (fragile, ToS risk), commit originals as PNG/JPG (larger). Trade-off: repo grows with image binaries; acceptable for a seasonal guide (~50 small images).

### D5: Enrichment cache at `/.cache/enrichment.json` (gitignored)
**Choice:** Cache keyed by show slug → `{ url, coverPath, anilistId, resolvedAt, source }`. Reused across builds. `--fresh` flag or deleting the file forces re-resolution.
**Why:** AniList/Jikan rate limits + build speed. A full re-resolve of 50 shows on every CI run is slow and flaky. Cache makes rebuilds fast and offline-capable.
**Alternatives:** No cache (slow, flaky CI), cache in `/src/` (committed, stale risk), SQLite (overkill).

### D6: `base` path via env var, single source in `astro.config.mjs`
**Choice:** `base` = `import.meta.env.BASE_PATH ?? '/'`. Set `BASE_PATH=/charcuterie_board/` in the Pages workflow for project Pages; omit for custom domain.
**Why:** Same build works for project Pages and custom domain. Astro's `import.meta.env.BASE_URL` propagates to components automatically.
**Alternatives:** Hardcode (breaks custom domain), two configs (drift).

### D7: GitHub Actions workflow with `actions/deploy-pages`
**Choice:** `.github/workflows/deploy.yml` on push to `main`: install, build with `BASE_PATH`, upload `dist/` artifact, deploy via `actions/deploy-pages@v4`.
**Why:** Official, supported path for Pages deployment from any repo.
**Alternatives:** `gh-pages` npm branch push (older pattern, more friction).

### D8: URL resolution strategy for placeholder IDs
**Choice:** The parser marks any URL containing `GDKHZEJPQ` (or matching the known placeholder patterns) as `unresolved`. The enricher then attempts to find the real streaming URL by searching AniList/Jikan external links field; if no streaming link is found, the show card renders with a "link TBA" state pointing to a search URL (e.g. `https://www.crunchyroll.com/search?q=<title>`).
**Why:** Never ship a broken link; always give the user a next step. Build never fails on unresolved URLs.
**Alternatives:** Hard-fail the build (rejects valid-but-unreleased shows), leave placeholder (bad UX).

## Risks / Trade-offs

- [AniList/Jikan rate limits or downtime during CI build] → Cache means most builds reuse prior results; `--fresh` only on demand. Fetch has retry + backoff. Unresolved shows render with "link TBA" so build never fails.
- [Cover art not found for an obscure show] → Fallback to a category-colored placeholder card; never a broken image.
- [Title matching picks the wrong show (e.g. sequel vs. original)] → Store the matched AniList ID in the cache file so a human can audit/correct by editing `/.cache/enrichment.json` (manual override key: `overrideAnilistId`).
- [Repo bloat from committed WebP covers] → ~50 images at ~20-50KB each ≈ 1-2.5MB. Acceptable; `.gitattributes` can mark them if LFS ever needed.
- [Board Markdown format drift (human edits break parser)] → Parser is tolerant: missing URL line, missing blurb, extra blank lines all degrade gracefully. A parser warning is logged but build continues.
- [GitHub Pages project path vs. custom domain mismatch] → D6 env-driven `base` covers both; documented in README.
- [Future multi-season expansion] → Out of scope now, but parser takes a `season` arg and routing is structured so `/[season]/` could be added later without rework.

## Open Questions

- Final Google repo name for deployment (affects `BASE_PATH`) — user will provide after local validation. Until then, local dev uses `BASE_PATH=/` and the workflow is parameterized.
- Whether to auto-run `--fresh` on a schedule (e.g. weekly) to pick up newly-released real URLs — deferred; manual trigger via workflow_dispatch is included as a starting point.