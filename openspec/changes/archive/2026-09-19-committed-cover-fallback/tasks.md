## 1. Committed-cover fallback helper

- [x] 1.1 Add `committedCoverPath(seasonSlug, showSlug): string | null` to `src/lib/enrich/cover.ts` — returns the public path `/covers/<season-slug>/<show-slug>.webp` when `public/covers/<season-slug>/<show-slug>.webp` exists on disk, else `null`. Reuse the existing `COVERS_DIR` / `PUBLIC_COVER_PREFIX` constants; export alongside `downloadAndStoreCover`.

## 2. Enricher integration

- [x] 2.1 In `src/lib/enrich/index.ts` `enrichShows()` cached path (line ~102): when `cached.coverPath` is null, call `committedCoverPath(season.slug, show.slug)` and use its result for `coverPath`.
- [x] 2.2 In `src/lib/enrich/index.ts` `enrichShows()` miss/resolver path: when final `coverPath` is null (no `r.coverUrl` and no `cached?.coverPath`), call `committedCoverPath(...)` and use its result. Do not write the fallback into the cache entry (D4).
- [x] 2.3 Confirm no other code path sets `coverPath` (grep `coverPath` across `src/`) so the fallback is exhaustive.

## 3. Backfill untracked-cover warning

- [x] 3.1 In `scripts/backfill-cover.ts` after a successful store: check `git ls-files --error-unmatch public/covers/<season>/<slug>.webp` (wrapped in try/catch; skip silently when git unavailable) and print a warning when the file is untracked, telling the contributor to `git add` it before pushing because CI builds only see committed covers.

## 4. Documentation

- [x] 4.1 README "Covers" section: document that committed cover files are the source of truth for cover presence (render in any build, including cache-less CI), that backfilled covers must be committed before pushing, and that the backfill script warns when a cover is untracked.

## 5. Verification

- [x] 5.1 Unit-style check: with the cache present, `npm run build` — output identical to current build (no regression; all 79 Fall + 63 Summer covers still render).
- [x] 5.2 Cache-less simulation: `mv .cache .cache.bak && npm run build` — verify `dist/fall-2026/index.html` references all 79 committed Fall covers (grep count of `covers/fall-2026/` img srcs) and `dist/summer-2026/index.html` all 63 Summer covers; then restore `mv .cache.bak .cache` and rebuild.
- [x] 5.3 Simulate CI exactly: `BASE_PATH=/charcuterie_board/ SITE=https://dragonman117.github.io npm run build` with the cache still moved aside; confirm all committed covers referenced and asset paths prefixed. Restore cache and rebuild default.
- [x] 5.4 Verify the one joke entry (`meitantei-conan-30-gou-satsujin-jiken-see-sci-fi-the-man-is-genre-fluid`) still renders the placeholder (no committed cover) and the build succeeds.
- [x] 5.5 Run `npx tsx src/lib/__tests__/parseBoard.test.ts` and `npx tsx src/lib/__tests__/seasons.test.ts` — both PASS.
- [x] 5.6 Backfill warning check: temporarily rename one committed cover aside, run `npx tsx scripts/backfill-cover.ts fall-2026 <its-slug> <an-image-url>` (any reachable image URL), confirm the untracked warning prints, then `git checkout` the original cover and confirm `git status` is clean for it.