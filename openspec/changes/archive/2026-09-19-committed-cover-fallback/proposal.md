## Why

On the deployed GitHub Pages site, only 20 of 80 Fall 2026 cards render cover art (61 placeholders); Summer shows 18 of 63. The enrichment cache (`.cache/`) is gitignored, so the CI deploy rebuilt from live APIs without the locally backfilled cache: not-yet-announced and rate-limited shows resolved no cover, while 79 committed WebP files sit in `dist/covers/` unreferenced. The site must render committed covers regardless of whether CI's live re-resolution succeeds.

## What Changes

- The enricher falls back to a **committed cover file** at `public/covers/<season-slug>/<show-slug>.webp` when a show has no `coverPath` (no cache, or cache entry without a cover) — instead of rendering a placeholder.
- Committed covers are the **source of truth for cover presence**: a build with zero API coverage still renders every committed cover.
- The backfill script prints a warning when it records a `coverPath` for a file that is not committed (so contributors notice untracked covers before pushing).
- README documents the commit-covers workflow and the CI cache-less rebuild behavior.
- No change to runtime site behavior (pages stay static, no runtime fetches); no change to the deploy workflow.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `show-enrichment`: Cover resolution gains a build-time fallback to committed cover files when neither the cache nor the APIs produce a cover, and the backfill path warns on covers not under version control.

## Impact

- **Code**: `src/lib/enrich/index.ts` (fallback lookup after cache/miss path), possibly a small helper in `src/lib/enrich/cover.ts` (`coverFileExists`/`committedCoverPath`), `scripts/backfill-cover.ts` (untracked-cover warning), `README.md` (workflow docs).
- **Existing behavior**: Shows that previously rendered placeholders in a cache-less CI build now render their committed covers. Locally cached builds are unaffected (cache `coverPath` still wins when present).
- **No API/dependency changes**; deploy workflow untouched; cover files themselves already committed (79 Fall, 63 Summer).