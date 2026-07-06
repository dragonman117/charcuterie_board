# Charcuterie Board

A static, mobile-first seasonal anime guide built with [Astro](https://astro.build). The human-edited Markdown file at `boards/Summer 2026.md` is the single source of truth; at build time the site resolves real streaming URLs and cover art via AniList (primary) / Jikan (fallback) and renders a self-contained static site deployable to GitHub Pages.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serve the built site locally
```

## How it works

1. **Parser** (`src/lib/parseBoard.ts`) reads `boards/Summer 2026.md` read-only and produces a structured show list (categories, shows with title/URL/blurb/markers). Placeholder URLs (Crunchyroll `GDKHZEJPQ`, placeholder Netflix IDs) are flagged `unresolved`.
2. **Enrichment** (`src/lib/enrich/`) resolves each show at build time:
   - AniList GraphQL (primary) → Jikan v4 REST (fallback) → search-fallback URL (unresolved).
   - Cover art is downloaded and stored locally as WebP under `/public/covers/`.
   - Results cached to `/.cache/enrichment.json` (gitignored) for fast rebuilds.
   - Build never fails on unresolved shows — they render with a "Link TBA" + search link.
3. **Render** (`src/pages/index.astro` + `src/components/`) renders a mobile-first page: sticky category nav, show cards with covers, quick-stats footer.

### Re-resolve enrichment

```bash
npm run enrich:fresh   # ENRICH_FRESH=1 astro build — ignores cache, re-fetches from APIs
rm -rf .cache          # or just delete the cache file
```

### Manual override

Edit `/.cache/enrichment.json` and add `"overrideAnilistId": <id>` to a show's entry to force a specific AniList match (useful when title matching picks the wrong sequel).

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. The `.github/workflows/deploy.yml` workflow builds and deploys on every push to `main`.

### Base path

The workflow auto-detects the base path from the repo name for project Pages (`<user>.github.io/<repo>` → `BASE_PATH=/<repo>/`). For a **custom domain**, trigger the workflow manually (workflow_dispatch) and set the `base_path` input to `/`.

To build locally with a specific base path:

```bash
BASE_PATH=/charcuterie_board/ npm run build
```

## Project structure

```
boards/Summer 2026.md     # human-edited source of truth (read-only at build)
src/lib/parseBoard.ts     # Markdown → structured show list
src/lib/enrich/           # AniList + Jikan resolvers, cache, cover downloader
src/components/           # Layout, CategoryNav, CategorySection, ShowCard, QuickStats
src/pages/index.astro     # single page: parse → enrich → render
public/covers/            # generated WebP cover art (committed, self-contained)
.cache/enrichment.json    # enrichment cache (gitignored)
.github/workflows/deploy.yml
```

## Notes

- AniList's public API occasionally has outages; the Jikan fallback carries the load when that happens. Re-run `npm run enrich:fresh` later to pick up AniList-resolved URLs once it's back.
- The board Markdown file is never modified by the build.