## Why

The Summer 2026 anime guide currently lives as a hand-edited Markdown file with placeholder URLs (`GDKHZEJPQ`) and no cover art, making it hard to share and verify. A static, mobile-first web page built with Astro and deployable to GitHub Pages turns it into a browsable, visual guide while keeping the Markdown as the single human-edited source of truth and auto-resolving real streaming URLs + cover art at build time.

## What Changes

- **New** Astro project at repo root (`/src`, `astro.config.mjs`, `package.json`) generating a static site from `boards/Summer 2026.md`.
- **New** Markdown parser that reads the seasonal guide and produces a structured show list (title, category, raw URL/blurb from the `.md`).
- **New** Build-time enrichment service that resolves each show to a real streaming URL + cover art image via AniList GraphQL (primary) with Jikan/MAL REST fallback. Results are cached to `/.cache/enrichment.json` so rebuilds stay fast and offline-friendly.
- **New** Mobile-first UI: category sections, per-show cards (cover art, title, streaming link, blurb), quick-stats footer. Responsive 1→2→3 column grid.
- **New** Configurable `base` path in `astro.config.mjs` so the same build works for a project Pages URL (`/charcuterie_board/`) or a custom domain — set via env var.
- **New** GitHub Pages deployment workflow (`.github/workflows/deploy.yml`) building on push and publishing the `dist/` artifact.
- **New** Cover art assets cached locally under `/public/covers/<slug>.webp` so the deployed site is self-contained (no hotlinking).
- **No breaking changes** to existing repo contents — `boards/Summer 2026.md` stays the canonical, human-edited source; nothing else is removed.

## Capabilities

### New Capabilities
- `guide-parser`: Parses `boards/<season>.md` into a structured show list (season metadata, categories, shows with raw URL + blurb). Tolerant of placeholder URLs and missing fields.
- `show-enrichment`: Resolves each parsed show to a canonical streaming URL and cover art image at build time via AniList (primary) / Jikan (fallback), with a local cache and a graceful "unresolved" state so build never fails on a bad lookup.
- `site-rendering`: Astro-based mobile-first static site that renders the enriched guide: category navigation, show cards, quick stats. Configurable `base` path and self-contained cover art.
- `pages-deploy`: GitHub Actions workflow that builds the Astro site and deploys `dist/` to GitHub Pages. `base` path driven by deployment env so the same build works for project Pages or a custom domain.

### Modified Capabilities
<!-- None — no existing specs in openspec/specs/ -->

## Impact

- **New code**: Astro project at repo root; TypeScript parser module; enrichment fetcher + cache; UI components; GH Actions workflow.
- **Dependencies**: `astro`, `@astrojs/mdx` (optional), `marked` or custom Markdown tokenizer for the board format, AniList/Jikan fetch logic (no runtime API — build-time only).
- **Data flow**: `boards/Summer 2026.md` (human source of truth) → parser → enrichment (cached) → Astro pages → `dist/` → GitHub Pages.
- **Repo additions**: `/.cache/` (gitignored), `/public/covers/` (committed, derived), `/src/`, `/dist/` (gitignored), `.github/workflows/deploy.yml`, `astro.config.mjs`, `package.json`, `tsconfig.json`.
- **No changes** to existing files outside `boards/` (which remains the source of truth and is only read, not written, at build time).
- **External APIs**: AniList GraphQL (`https://graphql.anilist.co`) and Jikan REST (`https://api.jikan.moe/v4`) called at build time only; rate-limited with retries. No runtime API keys required.