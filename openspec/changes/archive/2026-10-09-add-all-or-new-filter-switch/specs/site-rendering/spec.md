## MODIFIED Requirements

### Requirement: Category navigation
The page SHALL render category navigation in two modes driven by viewport width. On viewports ≥ 768px it SHALL render a sticky top pill bar listing all categories in source order, each pill linking to the corresponding section via anchor, with monospace labels and per-category counts, and the new-shows filter switch SHALL be rendered at the right end of the same sticky bar, always reachable even when the category pills overflow and scroll. On viewports < 768px the pill bar SHALL be hidden and replaced by a hamburger button in the sticky header that toggles a slide-down panel listing the categories with counts, and the filter switch SHALL be rendered in the same sticky header row as the hamburger button so it is reachable without opening the panel. Per-category counts in both the pill bar and the mobile panel SHALL reflect the currently active show filter: when "Only New" is active, each count SHALL be the number of visible brand-new shows in that category, and any category with zero visible shows SHALL be omitted from both the pill bar and the mobile panel until the filter returns to "All". The current category SHALL be highlighted as the user scrolls (via a small inline script or CSS scroll-spy). The hamburger button SHALL expose `aria-expanded` reflecting panel state; pressing Esc SHALL close the panel.

#### Scenario: Desktop category nav
- **WHEN** the page loads at a viewport ≥ 768px
- **THEN** a sticky pill bar shows all category names in monospace with per-category counts, the "All / Only New" filter switch is visible at the right end of the sticky bar, and clicking a pill scrolls to that section; no hamburger button is visible

#### Scenario: Mobile category nav closed
- **WHEN** the page loads at a viewport < 768px
- **THEN** the pill bar is hidden and a hamburger button is visible in the sticky header with `aria-expanded="false"`, no panel showing, and the filter switch is visible in the same sticky row as the hamburger button

#### Scenario: Mobile category nav opened
- **WHEN** the user taps the hamburger button at < 768px
- **THEN** a slide-down panel appears listing categories with counts, `aria-expanded` becomes `"true"`, and the panel pushes page content (no overlay/backdrop)

#### Scenario: Mobile category nav category tapped
- **WHEN** the user taps a category in the open mobile panel
- **THEN** the page scrolls to that category section and the panel closes (`aria-expanded` returns to `"false"`)

#### Scenario: Mobile category nav dismissed with Esc
- **WHEN** the panel is open and the user presses Escape
- **THEN** the panel closes and `aria-expanded` becomes `"false"`

#### Scenario: Counts react to the show filter
- **WHEN** the user activates "Only New" on a page where at least one category contains no brand-new shows
- **THEN** every category count in the pill bar and mobile panel shows its brand-new count, and categories with zero brand-new shows are omitted from both navigation modes; when the user returns to "All", the original counts and categories are restored

### Requirement: Show card content
Each show SHALL render as a card containing: cover image (or placeholder), title, blurb text, and a clickable link to the resolved streaming URL (or "link TBA" + search fallback when unresolved). Continuing shows SHALL display a "Continuing" badge; sequel shows SHALL display a "Sequel" badge; movies SHALL display a "Movie" badge. Card surfaces, borders, text, and badges SHALL use the design tokens (`var(--surface)`, `var(--border)`, `var(--text)`, `var(--font-mono)` for badges) so they restyle correctly under both dark and light themes. Placeholder cover colors SHALL be muted tones derived from the mesh-gradient hues so they differentiate categories without breaking the monochrome canvas.

#### Scenario: Resolved show card
- **WHEN** a show has `source: "anilist"` or `"jikan"` and a valid `coverPath`
- **THEN** the card shows the local cover image, title, blurb, and a link labeled with the streaming service name pointing to `resolvedUrl`, all styled via tokens

#### Scenario: Unresolved show card
- **WHEN** a show has `source: "unresolved"`
- **THEN** the card shows a placeholder cover (muted category color), title, blurb, and a "Link TBA" link pointing to the search fallback URL

#### Scenario: Continuing show badge
- **WHEN** a show's `markers` includes `continuing`
- **THEN** the card displays a "Continuing" badge near the title in monospace uppercase

#### Scenario: Sequel show badge
- **WHEN** a show's `markers` includes `sequel`
- **THEN** the card displays a "Sequel" badge near the title in monospace uppercase, styled like the "Continuing" badge

#### Scenario: Card restyles with theme
- **WHEN** the user switches between dark and light themes
- **THEN** the card surface, border, text, and badge colors update to match the active theme without a page reload

### Requirement: Quick stats footer
The page SHALL render a footer section with the quick-stats from the board file (total shows, new shows, sequels, continuing, movies, per-service counts). The renderer SHALL compute these counts from the parsed data rather than trusting the board's prose: continuing = shows whose `markers` include `continuing`, sequels = shows whose `markers` include `sequel`, movies = shows whose `markers` include `movie` (exact marker matches), and new = shows whose `markers` include neither `continuing` nor `sequel`. The footer SHALL display new and sequels as separate figures — not merged into one — alongside total shows, continuing, movies, links-resolved, and per-service counts, and SHALL display the board's prose stats alongside. The quick-stats SHALL always describe the whole board and SHALL NOT react to the show filter. The footer SHALL consume design tokens for its surface, borders, and text; stat numbers SHALL render in the monospace font and the accent color. Per-service detection SHALL recognize all services appearing in the boards, including Crunchyroll, HIDIVE, Netflix, Disney+, and Prime Video.

#### Scenario: Stats rendered
- **WHEN** the page loads
- **THEN** the footer shows the computed counts (total shows, new, sequels, continuing, movies, per service) in monospace accent-colored numbers, the board's original `## QUICK STATS` prose, and all colors adapt to the active theme

#### Scenario: Computed stats from markers
- **WHEN** a board's shows carry `*(continuing)*`, `*(sequel)*`, and `*(movie)*` markers
- **THEN** the footer's figures are computed from those markers (e.g. the Fall 2026 board: Total 80, New 51, Sequels 20, Continuing 9, Movies 4), and the "New" figure equals the number of shows that remain visible under "Only New"

#### Scenario: Disney+ and Prime Video shows counted
- **WHEN** a season board contains shows whose links point to `disneyplus.com` and `primevideo.com` (or amazon.com video pages)
- **THEN** those shows are counted under Disney+ and Prime Video service pills respectively rather than lumped into Other

## ADDED Requirements

### Requirement: New-shows filter
Each season page SHALL provide a two-state show filter rendered as a segmented switch with the states "All" and "Only New". The switch SHALL be styled with the design tokens (monospace labels matching the category pills) with a clearly visible active state, exposed as buttons that are keyboard-operable and announce their state via `aria-pressed`. The default state SHALL be "All": every show is visible. When "Only New" is active, the page SHALL show only brand-new shows: every show whose parsed `markers` include `continuing` or `sequel` (exact match, consistent with the quick-stats convention) SHALL be hidden, preserving category order and each category's show order. The active filter SHALL persist across page loads via `localStorage` and SHALL be applied before first paint so no flash of the unfiltered state is visible for returning users. When JavaScript is unavailable, the page SHALL render in the "All" state with every show visible. The filter SHALL NOT alter the quick-stats footer, which always describes the whole board.

#### Scenario: Default state shows all
- **WHEN** a season page loads with no stored filter preference
- **THEN** all shows are visible, the "All" button is the active one, and continuing cards show their "Continuing" badges and sequel cards their "Sequel" badges

#### Scenario: Only New hides continuing and sequel shows
- **WHEN** the user activates "Only New"
- **THEN** every show carrying a `continuing` or `sequel` marker disappears from all categories and all brand-new shows remain visible in place

#### Scenario: Fall 2026 guide reacts to the filter
- **WHEN** the user activates "Only New" on the Fall 2026 season page
- **THEN** all 29 returning shows are hidden — the 9 continuing long-runners (e.g. One Piece, Case Closed, Beyblade X) and the 20 sequel premieres (e.g. The Apothecary Diaries Season 3, Blue Box Season 2, Cyberpunk: Edgerunners 2) — leaving the 51 brand-new shows, and the quick-stats "New" figure agrees with what is on screen

#### Scenario: Category with no brand-new shows disappears
- **WHEN** "Only New" is active and a category contains no brand-new shows (e.g. Fall 2026's SPORTS category: 1 continuing + 3 sequels)
- **THEN** that category's nav pill, mobile panel entry, and section are hidden, and returning to "All" restores them

#### Scenario: Toggle back to All restores everything
- **WHEN** the user re-activates "All" after "Only New"
- **THEN** every hidden card, per-category count, and any hidden category is restored exactly as before

#### Scenario: Filter preference persists across reloads
- **WHEN** a user with "new" stored reloads a season page
- **THEN** the first painted frame already shows the filtered state, the "Only New" button is active, and category counts reflect visible shows

#### Scenario: Filter switch is keyboard-operable
- **WHEN** the user focuses the inactive filter button and presses Enter or Space
- **THEN** the filter toggles exactly as on click, `aria-pressed` updates, and counts/categories update accordingly

#### Scenario: No-JavaScript fallback
- **WHEN** a season page renders with JavaScript disabled
- **THEN** every show is visible in the "All" state and no content is unreachable

#### Scenario: Quick stats stay whole-board
- **WHEN** "Only New" is active
- **THEN** the quick-stats footer still shows the computed whole-board counts (total, new, sequels, continuing, movies, per-service) unchanged