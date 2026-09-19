## Context

See proposal.md — Why / What Changes.

Relevant current state (from `add-fall-2026-season`, archived):

- `src/lib/enrich/index.ts` `enrichShows()`: per-show, cached path uses `cached.coverPath`; miss path uses the resolver result (`r.coverUrl ? downloadAndStoreCover(...) : cached?.coverPath ?? null`). With no cache, a live-resolution failure yields `coverPath: null` → placeholder.
- `src/lib/enrich/cover.ts` stores covers at `public/covers/<season-slug>/<show-slug>.webp` and returns the public path `/covers/<season-slug>/<show-slug>.webp`. Season scoping is already collision-free.
- `.cache/` is gitignored; CI (`deploy.yml`) runs `npm ci && npm run build` on a clean checkout, so CI builds have no enrichment cache.
- Covers are already committed: 79/80 Fall, 63/63 Summer (the missing Fall entry is the deliberate joke-annotation entry, allowed by the previous change).

## Goals / Non-Goals

**Goals**
- Every show with a committed cover file renders that cover in any build, including cache-less CI builds and API-failure builds.
- Preserve existing precedence when a cache exists: cache `coverPath` first, committed file as fallback.
- No behavior change at runtime; no new runtime requests; no deploy workflow change.

**Non-Goals**
- Committing `.cache/` or seeding CI with cache artifacts (cache remains a local-only optimization).
- Re-resolving or re-downloading covers that already exist on disk (idempotent builds; disk files win).
- Changing the deploy workflow, Astro config, or site rendering/components.
- Fixing the one deliberate placeholder (joke annotation entry).

## Decisions

**D1 — Fallback lookup lives in the enricher, not the renderer.**
In `enrichShows()`, after determining `coverPath` (both the cached path and the miss/resolver path), if `coverPath` is null, check `fs.existsSync(public/covers/<season-slug>/<show-slug>.webp)` and use `/covers/<season-slug>/<show-slug>.webp` if present. The renderer (`ShowCard`) and `coverPath` semantics stay untouched; the fix is invisible to rendering code.
*Alternative*: fallback in `ShowCard.astro` — rejected: spreads cover resolution logic into rendering, and dist `coverPath` values would still be null (breaks the "commit covers = source of truth" invariant for any other consumer).

**D2 — Filesystem check via a small helper in `cover.ts`.**
Add `committedCoverPath(seasonSlug, showSlug): string | null` next to `downloadAndStoreCover` (which owns the covers dir/prefix constants). One code path for the path shape; no duplication of `/covers/` prefix.
*Alternative*: inline `fs.existsSync` in `index.ts` — rejected: duplicates the path construction already owned by `cover.ts`.

**D3 — Precedence: committed file also backstops cache entries with `coverPath: null`.**
The check runs whenever `coverPath` is null after cache/resolution — including a cache entry that records `coverPath: null` (exactly the CI scenario: no cache → all entries are "misses"; but also covers a stale/partial local cache). This makes the committed file the sole source of truth for cover *presence*; cache/APIs only ever *add* covers.
*Alternative*: only fall back on cache miss — rejected: a cache entry with null cover would still suppress a committed cover in local rebuilds, leaving the class of bug open.

**D4 — The fallback does not write to the cache.**
Fallback covers are not persisted into the cache entry (no `setEntry` mutation for fallback). Rationale: the file's existence is already the durable record; writing it would mutate cache semantics and make `coverPath` indistinguishable from API-resolved covers. Cost: a cache-less build "re-falls-back" every time — a no-op since it's a local `existsSync`.
*Alternative*: persist fallback into cache — rejected: mixes provenance and adds writes to a read path.

**D5 — Backfill script warns on untracked covers via `git ls-files`.**
After storing the file, `scripts/backfill-cover.ts` runs `git ls-files --error-unmatch <path> --` (or `--others` check) and prints a warning when the file is untracked: "cover not committed — run `git add public/covers/<season>/<slug>.webp` before pushing; CI builds only see committed covers." Warning-only; never fails the backfill.
*Alternative*: commit automatically from the script — rejected: scripts shouldn't stage/commit; that's the contributor's call.
*Alternative*: CI check that fails on missing covers — rejected: out of scope, and placeholder covers are legitimate for unannounced shows.

**D6 — README documents the contract.**
Add a "Covers & CI" note: committed covers render even when the cache is absent (CI rebuilds from live APIs); always commit backfilled covers before pushing; the cache is local-only.

## Risks / Trade-offs

- [Committed file present but stale/incorrect for the show] → Same risk as any committed asset today; the fallback only *adds* covers that would otherwise be placeholders, so it never replaces a resolved cover. Accepted.
- [`existsSync` at build time per null-cover show] → Trivial cost (≤80 stat calls/build, local FS). Accepted.
- [A show's committed file exists but board slug changed] → Falls back to nothing (no file at new slug), placeholder renders — same as current behavior; backfill re-adds. No action.
- [Untracked-cover warning depends on git] → Script is already repo-local; if git is unavailable the warning step is skipped silently (try/catch), backfill still succeeds.

## Migration Plan

1. Implement fallback (D1–D4); no data changes needed — committed covers already exist.
2. Local verification: temporarily move `.cache/` aside, `npm run build`, confirm all committed covers render in `dist/`; restore cache.
3. Push to `main`; CI rebuilds without cache; deployed site renders committed covers immediately. No rollback machinery needed — reverting the commit restores prior behavior.

## Open Questions

(none)