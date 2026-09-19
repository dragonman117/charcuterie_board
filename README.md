# Charcuterie Board

A static, mobile-first seasonal anime guide built with [Astro](https://astro.build). Each human-edited Markdown file under `boards/` (e.g. `boards/Fall 2026.md`) is the source of truth for one season; at build time the site resolves real streaming URLs and cover art via AniList (primary) / Jikan (fallback) and renders a self-contained static site deployable to GitHub Pages. Every board gets its own page at `/<season-slug>/` (e.g. `/fall-2026/`, `/summer-2026/`) with a season index at `/` linking them all.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serve the built site locally
```

## How it works

1. **Season discovery** (`src/lib/seasons.ts`) enumerates `boards/*.md`, parses each board's H1 + metadata line, and derives `{ slug, title, seasonTerm, seasonYear, sortKey }` (newest season first). Seasons are discovered — adding a new board file automatically adds a new page.
2. **Parser** (`src/lib/parseBoard.ts`) reads each board read-only and produces a structured show list (categories, shows with title/URL/blurb/markers). Placeholder URLs (Crunchyroll `GDKHZEJPQ`, placeholder Netflix IDs) are flagged `unresolved`.
3. **Enrichment** (`src/lib/enrich/`) resolves each show at build time, season-scoped:
   - AniList GraphQL (primary, queried with the board's `season`/`seasonYear`) → Jikan v4 REST (fallback) → search-fallback URL (unresolved).
   - Cover art is downloaded and stored locally as WebP under `public/covers/<season-slug>/`.
   - Results cached to `.cache/enrichment/<season-slug>.json` (gitignored) for fast rebuilds; a legacy flat `.cache/enrichment.json` is migrated to `summer-2026.json` once.
   - Build never fails on unresolved shows — they render with a "Link TBA" + search link.
4. **Render** (`src/pages/[season].astro` + `src/components/`) renders each season at `/<season-slug>/` with a mobile-first layout: sticky category nav, show cards with covers, quick-stats footer, and a season switcher (pill links ≥ 768px, `<select>` below). `src/pages/index.astro` lists all seasons (newest first, "current" badge on the newest).

### Re-resolve enrichment

```bash
npm run enrich:fresh   # ENRICH_FRESH=1 astro build — ignores cache, re-fetches from APIs
rm -rf .cache          # or just delete the cache directory
```

Warning: `enrich:fresh` discards **all** cached state, including manual backfills (see below) — re-run those afterward or restore from git history.

### Manual override

Edit `.cache/enrichment/<season-slug>.json` and add `"overrideAnilistId": <id>` to a show's entry to force a specific AniList match (useful when title matching picks the wrong sequel).

### Cover backfill

When a show has no API cover (unreleased/TBD titles), backfill one manually:

```bash
npx tsx scripts/backfill-cover.ts <season-slug> <show-slug> <image-url>
# e.g.
npx tsx scripts/backfill-cover.ts fall-2026 tank-chair "https://.../key-visual.webp"
```

The script downloads the image via the same pipeline (converted to WebP), writes it to `public/covers/<season-slug>/<show-slug>.webp`, records `coverPath` in the season's cache entry, and prints the shows still missing covers. Rebuild with `npm run build` afterward (never `enrich:fresh` — it wipes the backfilled `coverPath`).

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
boards/*.md               # human-edited source of truth, one file per season (read-only at build)
src/lib/seasons.ts        # board discovery → season slugs/order
src/lib/parseBoard.ts     # Markdown → structured show list
src/lib/enrich/           # AniList + Jikan resolvers, season-scoped cache, cover downloader
src/components/           # Layout (season switcher), CategoryNav, CategorySection, ShowCard, QuickStats
src/pages/index.astro     # season index (newest first)
src/pages/[season].astro  # per-season page: parse → enrich → render
scripts/backfill-cover.ts # manual cover backfill per season
public/covers/<season>/   # generated WebP cover art, season-scoped (committed, self-contained)
.cache/enrichment/        # per-season enrichment caches, one JSON per season (gitignored)
.github/workflows/deploy.yml
```

## Notes

- AniList's public API occasionally has outages; the Jikan fallback carries the load when that happens, and the build succeeds even with both unreachable (unresolved shows render "Link TBA" + a search link). Re-run `npm run enrich:fresh` later to pick up AniList-resolved URLs once it's back.
- The board Markdown files are never modified by the build.
- All internal links (season pages, switcher, covers) honor `BASE_PATH`, so the same output works at a project Pages URL and a custom domain.