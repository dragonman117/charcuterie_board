## Why

The live Fall 2026 guide interleaves 29 returning shows — 9 long-running carryovers (One Piece, Case Closed, Beyblade X, …) and 20 sequel premieres (The Apothecary Diaries Season 3, Blue Box Season 2, Cyberpunk: Edgerunners 2, …) — with the season's 51 brand-new shows, and the guide itself has no way to view only what's genuinely new. A filter switch in the existing category-nav bar (the site's filter bar) closes that gap. "Only New" means brand-new shows only: no continuing carryovers, no returning sequels.

Data problem found while scoping: the boards mark almost none of this in machine-readable form. In `boards/Fall 2026.md`, 7 of the 9 continuing shows carry `(continuing)` inline inside the bold title (e.g. `- **One Piece (continuing)**`) instead of the `*(continuing)*` marker form the parser extracts; the 20 sequel premieres carry no marker at all (no sequel marker exists today); and the 4 movie lines inline their `(movie)` info in titles too. Today those shows render mangled titles with no badges, QuickStats reports "Continuing: 2" and "Movies: 0" when the true counts are 9 and 4, and no marker-driven feature can see them — so the guides cannot react to an "Only New" filter until the board markers are normalized and extended with a `*(sequel)*` marker.

## What Changes

- **New** "All / Only New" filter switch in the filter bar (`CategoryNav.astro`): a two-button segmented control (monospace token-styled pills, `aria-pressed` state) — pinned at the right end of the sticky category pill row on desktop (≥ 768px), and in the hamburger row on mobile (< 768px). Applies to every season page (shared component). Under "Only New", only brand-new shows remain visible.
- **New** `*(sequel)*` marker convention on boards: unmarked = brand new; `*(continuing)*` = carryover still airing from a previous season; `*(sequel)*` = returning franchise entry premiering this season. The parser is unchanged (parenthetical markers are free-form per the guide-parser spec).
- **New** client-side filtering behavior, no framework JS: continuing and sequel cards are tagged at build time (`data-continuing`, `data-sequel`); when "Only New" is active both are hidden via CSS driven by a `data-show-filter` attribute on `<html>`; category pill and mobile-panel counts swap to brand-new counts; categories with zero brand-new shows (Fall 2026's SPORTS: 1 continuing + 3 sequels, 0 brand-new) hide their pill, panel entry, and section; the choice persists in `localStorage` (same pattern as the theme toggle, applied pre-paint to avoid a flash); default is "All", and with JavaScript disabled everything remains visible.
- **Modified** `ShowCard.astro`: filter data attributes plus a new "Sequel" badge (mirroring the existing "Continuing" badge), so it is visible on the card why a show disappears under "Only New".
- **Modified** `QuickStats.astro`: the merged "New / sequels" figure splits into separate "New" (brand-new) and "Sequels" figures computed from the markers, joining "Total", "Continuing", "Movies", "Links resolved", and per-service counts. The "New" figure agrees by construction with what "Only New" shows on screen.
- **Modified** `boards/Fall 2026.md` (human content edit, not a build write), 31 lines: normalize the 7 inline `(continuing)` titles; add `*(sequel)*` to the 20 sequel premieres; normalize the 4 inline movie titles to the exact `*(movie)*` marker (release-date text stays readable on the card). Afterward the board parses to 80 shows with 9 continuing, 20 sequel, and 4 movie markers; QuickStats self-corrects (Continuing 2 → 9, Movies 0 → 4, New 51 / Sequels 20); and every continuing/sequel/movie show gains its badge with a clean title.
- **Modified** `boards/Summer 2026.md`, 16 lines: add `*(sequel)*` to its 16 sequel premieres (Mushoku Tensei Season 3, Re:ZERO Season 4, Grand Blue Dreaming Season 3, Bleach: Thousand-Year Blood War Part 4, …) so both live boards filter consistently. Its 5 exact `continuing` shows are untouched, and its variant `continuing from Spring` / `continuing from Winter` markers stay as-is (visible under "Only New" — deferred convention question).
- **No changes** to the parser, enrichment, season routing, deploy workflow, or design tokens. "Only New" is defined by markers only (exact match): a show is hidden iff its `markers` include `continuing` or `sequel`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `site-rendering`: The category navigation requirement gains the filter switch in both nav modes plus reactive per-category counts (brand-new counts; categories with zero brand-new shows omitted). A new "New-shows filter" requirement defines the All / Only-New behavior with the brand-new definition: default All, hiding `continuing`- and `sequel`-marked cards, count/category updates, localStorage persistence with pre-paint application, and the no-JS fallback. The show-card requirement gains the "Sequel" badge. The quick-stats requirement is updated to compute New / Sequels / Continuing / Movies from the parsed markers and to split the merged "New / sequels" figure into two.

## Impact

- **Modified code**: `src/components/CategoryNav.astro` (switch UI + filter script), `src/components/ShowCard.astro` (`data-continuing` / `data-sequel` attributes + "Sequel" badge), `src/components/CategorySection.astro` (count data attributes), `src/components/Layout.astro` (pre-paint filter application in the head script), `src/pages/[season].astro` (thread per-category brand-new counts into the nav), `src/components/QuickStats.astro` (split figures, 6-stat grid).
- **Modified data**: `boards/Fall 2026.md` — 31 title lines (7 continuing + 20 sequel + 4 movie), content-only; `boards/Summer 2026.md` — 16 title lines. URLs, blurbs, and ordering untouched. Boards remain read-only at build (these are human curation edits, same as any board update).
- **Observable side effect**: `/fall-2026/` QuickStats shows Total 80 / New 51 / Sequels 20 / Continuing 9 / Movies 4 (was "New / sequels" 78 / Continuing 2 / Movies 0); 31 fall cards gain badges (7 Continuing, 20 Sequel, 4 Movie) with cleaned-up titles; the SPORTS category hides entirely under "Only New" and returns on "All".
- **Other season pages**: `/summer-2026/` filters consistently: its 5 continuing and 16 sequel shows hide under "Only New", leaving 42 visible.
- **Dependencies/deploy**: none — no new packages, no runtime external requests, static output and GitHub Pages workflow unchanged.