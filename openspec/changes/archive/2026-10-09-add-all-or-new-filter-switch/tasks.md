## 1. Render-layer plumbing for the filter

- [x] 1.1 `ShowCard.astro`: add a `data-continuing` attribute to the `<article>` card when `show.markers.includes('continuing')` and a `data-sequel` attribute when `show.markers.includes('sequel')` (absent otherwise) — the build-time tags the CSS rule and counts key off (design D1)
- [x] 1.2 `ShowCard.astro`: render a "Sequel" badge (monospace uppercase, same styling/pipeline as the "Continuing" badge) when `markers` includes `sequel` (design D1, spec: Sequel show badge)
- [x] 1.3 `src/pages/[season].astro`: compute the per-category brand-new count (`shows.filter(s => !s.markers.includes('continuing') && !s.markers.includes('sequel')).length`) and pass `{ name, slug, count, newCount }` items into `CategoryNav`'s `categories` prop — same predicate as the filter and QuickStats (design D2/D4)
- [x] 1.4 `CategoryNav.astro`: extend the nav item props with `newCount` and emit `data-count-all` / `data-count-new` on both the desktop pills and the mobile panel items (design D2)

## 2. Filter switch UI in the bar

- [x] 2.1 Desktop mode: add the two-button segmented control ("All" / "Only New") pinned at the right end of `.catnav-wrap`, outside the horizontally scrolling `.catnav-inner` pill row, so it stays reachable when pills overflow (spec: Category navigation)
- [x] 2.2 Mobile mode: render the same control in the `.catnav-mobile` row next to the hamburger button, sharing classes/markup so both instances stay in sync via one script (spec: Category navigation)
- [x] 2.3 Accessibility + styling: wrap the control in `role="group"` with `aria-label="Show filter"`, expose `aria-pressed` on each button, give both buttons focus-visible rings and ≥ 44px touch targets, and style labels/active state with `var(--font-mono)` / token colors matching the category pills (design D2, design-tokens spec)

## 3. Filter behavior (CSS + scripts)

- [x] 3.1 Add the global hide rule `[data-show-filter='new'] .card[data-continuing], [data-show-filter='new'] .card[data-sequel] { display: none; }` in a global style context (Layout's `is:global` block or `:global()` in CategoryNav), then verify both unscoped selectors actually appear in the built CSS under `dist/` (design D1)
- [x] 3.2 `Layout.astro` head script: alongside the theme logic, read `localStorage.getItem('showFilter')` inside the existing try/catch and set `document.documentElement.dataset.showFilter = 'new'` pre-paint when the value is `'new'`; any other value leaves the "all" default (design D3)
- [x] 3.3 `CategoryNav.astro` inline script: clicking either switch instance flips `data-show-filter` on `<html>`, persists the value to `localStorage` (try/catch), syncs `aria-pressed` across both instances, and calls `syncUI()` (design D3)
- [x] 3.4 Implement `syncUI()`: for each category, write the active count (`data-count-all` vs `data-count-new`) into the pill and panel labels, and toggle `hidden` on the pill, panel item, and its `id={slug}` section when the active count is 0 — restoring everything on "All"; run it once on load so a persisted "new" state shows correct counts immediately (design D3/D6)

## 4. QuickStats split

- [x] 4.1 `QuickStats.astro`: compute `sequels` and `continuing` by exact marker match, `movies` by exact `movie` marker, and `new = total − continuing − sequels`; replace the merged "New / sequels" stat with separate "New" and "Sequels" stats (design D7, spec: Quick stats footer)
- [x] 4.2 `QuickStats.astro`: widen the stats grid from 5 to 6 cells (`grid-template-columns: repeat(6, 1fr)` at ≥ 640px; keep the 2-column mobile layout) so Total / New / Sequels / Continuing / Movies / Links resolved all render cleanly

## 5. Fall 2026 board marker pass (design D5)

- [x] 5.1 Normalize the 7 inline `(continuing)` titles to the `*(continuing)*` marker form — Beyblade X, One Piece, Red River, Rilakkuma, Odekake Kozame Season 2, Pocket Monsters (2023) / Pokémon Horizons, Nezumi-kun no Chokki Season 2 (e.g. `**One Piece (continuing)**` → `**One Piece** *(continuing)*`)
- [x] 5.2 Add `*(sequel)*` to the 20 sequel premieres — Reincarnated as a Sword S2, A Wild Last Boss Appeared! S2, A Returner's Magic Should Be Special S2, Sasaki and Peeps S2, As a Reincarnated Aristocrat S3, Black Clover S2, The Apothecary Diaries S3, Blue Box S2, Ranma ½ (2024) S3, The Ramparts of Ice S2, Chitose Is in the Ramune Bottle Part 2, HOTEL INHUMANS S2, Mission: Yozakura Family S2 Part 2, Aoashi S2, The Prince of Tennis II: U-17 World Cup, Ace of Diamond Act II — 2nd Season Cour 2, Kizudarake no Seijo yori Houfuku wo Komete S2, Cyberpunk: Edgerunners 2, Tokyo Revengers: War of the Three Titans Arc, Tougen Anki: Nikko Kegon Falls Arc (the last three added at the review checkpoint)
- [x] 5.3 Normalize the 4 movie lines to the exact `*(movie)*` marker form — Witch on the Holy Night, The Apothecary Diaries Movie: Bouhi no Hihou, Maebashi Witches: Emoemories, BanG Dream! Ave Mujica: Prima Aurora — inline `(movie, <date>)` parentheticals become the bare `*(movie)*` marker with the release date kept readable in the title or blurb (exact form matters: `*(movie, Oct 22)*` would not exact-match the `includes('movie')` predicates)
- [x] 5.4 Review checkpoint: board owner confirms the full marker list before commit, including the judgment calls in design D5 (Odekake Kozame S2 / Nezumi-kun S2 stay `continuing`; Yozakura S2 Part 2 and Prince of Tennis II get `sequel`; Conan TV special and My Happy Marriage Special Episode stay unmarked/visible; Maebashi Witches gets only `*(movie)*`) — checkpoint outcome (2026-10-09): owner confirmed four extra sequels (Cyberpunk: Edgerunners 2, Tokyo Revengers: War of the Three Titans Arc, Tougen Anki: Nikko Kegon Falls Arc in fall; Bleach: Thousand-Year Blood War Part 4 in summer); STEEL BALL RUN, the Bonobono block, BAKI-DOU, Sgt. Frog 2026, and Dragon Ball Super: Beerus stay unmarked per the owner's calls; final list signed off by the owner
- [x] 5.5 Re-run the parse check against the edited board: 80 shows; exactly 9 `continuing`, 20 `sequel`, and 4 `movie` markers; clean titles for all edited lines; `git diff` shows only the intended title lines changed (URLs, blurbs, ordering untouched)

## 6. Summer 2026 board marker pass (design D5)

- [x] 6.1 Add `*(sequel)*` to Summer's 16 sequel premieres — Mushoku Tensei: Jobless Reincarnation S3, Re:ZERO -Starting Life in Another World- S4 (Recapture Arc), That Time I Got Reincarnated as a Slime S4, Saga of Tanya the Evil S2, Skeleton Knight in Another World S2, Hell Mode S2, Trapped in a Dating Sim S2, From Old Country Bumpkin to Master Swordsman S2, Clevatess S2, You and I Are Polar Opposites S2, The 100 Girlfriends… Season 3, Hanazakari no Kimitachi e (Hana-Kimi) S2, The Elusive Samurai S2, Grand Blue Dreaming S3, Azur Lane: Slow Ahead! S2, Bleach: Thousand-Year Blood War Part 4 — The Calamity (added at the review checkpoint)
- [x] 6.2 Re-run the parse check: 63 shows; exactly 5 `continuing` and 16 `sequel` markers; 42 brand-new; variant markers (`continuing from Spring/Winter`, `movie + tv series`, `netflix movie`) untouched; `git diff` shows only the 16 intended title lines changed

## 7. Verification (spec scenarios)

- [x] 7.1 `npm run build` + preview at 375px / 768px / 1280px: switch is visible and usable in both nav modes, the pinned desktop switch stays put while pills scroll, and existing nav behaviors (hamburger, panel, Esc, anchor scroll) work while the filter is active
- [x] 7.2 Fall guide scenario: "Only New" on `/fall-2026/` hides all 29 returning shows (9 continuing + 20 sequel), leaving the 51 brand-new shows; category counts drop to brand-new counts; the SPORTS category's pill, panel entry, and section hide and are restored exactly on "All"; QuickStats always shows Total 80 / New 51 / Sequels 20 / Continuing 9 / Movies 4, and its "New" figure matches the visible remainder
- [x] 7.3 Interaction checks: Enter/Space on a focused switch button toggles the filter with `aria-pressed` updating; a reload with `'new'` stored paints the filtered state with no flash of unfiltered cards; with `localStorage` blocked (private mode) the page defaults to "All" with no console errors
- [x] 7.4 Summer page: switch renders and works — its 5 continuing and 16 sequel shows hide under "Only New" (42 visible); `continuing from Spring`/`Winter` variant-marker shows remain visible per design D4; counts react the same way
- [x] 7.5 Regression sweep: unit tests still green (no parser changes), page renders all shows with JavaScript disabled, `BASE_PATH=/charcuterie_board/ npm run build` still resolves all internal links, and both board files are byte-identical after a full build