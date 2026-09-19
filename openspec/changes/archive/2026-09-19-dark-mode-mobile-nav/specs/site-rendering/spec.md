## MODIFIED Requirements

### Requirement: Category navigation
The page SHALL render category navigation in two modes driven by viewport width. On viewports ≥ 768px it SHALL render a sticky top pill bar listing all categories in source order, each pill linking to the corresponding section via anchor, with monospace labels and per-category counts. On viewports < 768px the pill bar SHALL be hidden and replaced by a hamburger button in the sticky header that toggles a slide-down panel listing the categories with counts; tapping a category in the panel SHALL scroll to that section and close the panel. The current category SHALL be highlighted as the user scrolls (via a small inline script or CSS scroll-spy). The hamburger button SHALL expose `aria-expanded` reflecting panel state; pressing Esc SHALL close the panel.

#### Scenario: Desktop category nav
- **WHEN** the page loads at a viewport ≥ 768px
- **THEN** a sticky pill bar shows all category names in monospace and clicking one scrolls to that section; no hamburger button is visible

#### Scenario: Mobile category nav closed
- **WHEN** the page loads at a viewport < 768px
- **THEN** the pill bar is hidden and a hamburger button is visible in the sticky header with `aria-expanded="false"` and no panel showing

#### Scenario: Mobile category nav opened
- **WHEN** the user taps the hamburger button at < 768px
- **THEN** a slide-down panel appears listing categories with counts, `aria-expanded` becomes `"true"`, and the panel pushes page content (no overlay/backdrop)

#### Scenario: Mobile category nav category tapped
- **WHEN** the user taps a category in the open mobile panel
- **THEN** the page scrolls to that category section and the panel closes (`aria-expanded` returns to `"false"`)

#### Scenario: Mobile category nav dismissed with Esc
- **WHEN** the panel is open and the user presses Escape
- **THEN** the panel closes and `aria-expanded` becomes `"false"`

### Requirement: Render mobile-first static site from enriched guide
The system SHALL render a static HTML site from the parsed + enriched guide data using Astro. The site SHALL be mobile-first: single-column layout on viewports < 640px, expanding to 2 columns at ≥ 640px and 3 columns at ≥ 1024px. The site SHALL consist of a single season page rendering all categories. All styling SHALL consume the centralized design tokens (`var(--*)` from `src/styles/tokens.css`); dark mode SHALL be the default theme.

#### Scenario: Mobile viewport
- **WHEN** the page is viewed at a 375px width
- **THEN** show cards render in a single column with readable typography, tappable cover art, and no horizontal scroll, and the category navigation appears as a hamburger button (not a horizontal pill bar)

#### Scenario: Desktop viewport
- **WHEN** the page is viewed at a 1280px width
- **THEN** show cards render in a 3-column grid and the category navigation appears as a sticky pill bar

### Requirement: Show card content
Each show SHALL render as a card containing: cover image (or placeholder), title, blurb text, and a clickable link to the resolved streaming URL (or "link TBA" + search fallback when unresolved). Continuing shows SHALL display a "Continuing" badge; movies SHALL display a "Movie" badge. Card surfaces, borders, text, and badges SHALL use the design tokens (`var(--surface)`, `var(--border)`, `var(--text)`, `var(--font-mono)` for badges) so they restyle correctly under both dark and light themes. Placeholder cover colors SHALL be muted tones derived from the mesh-gradient hues so they differentiate categories without breaking the monochrome canvas.

#### Scenario: Resolved show card
- **WHEN** a show has `source: "anilist"` or `"jikan"` and a valid `coverPath`
- **THEN** the card shows the local cover image, title, blurb, and a link labeled with the streaming service name pointing to `resolvedUrl`, all styled via tokens

#### Scenario: Unresolved show card
- **WHEN** a show has `source: "unresolved"`
- **THEN** the card shows a placeholder cover (muted category color), title, blurb, and a "Link TBA" link pointing to the search fallback URL

#### Scenario: Continuing show badge
- **WHEN** a show's `markers` includes `continuing`
- **THEN** the card displays a "Continuing" badge near the title in monospace uppercase

#### Scenario: Card restyles with theme
- **WHEN** the user switches between dark and light themes
- **THEN** the card surface, border, text, and badge colors update to match the active theme without a page reload

### Requirement: Quick stats footer
The page SHALL render a footer section with the quick-stats from the board file (total shows, new series, sequels, per-service counts). The renderer SHALL compute these counts from the parsed data rather than trusting the board's prose, and SHALL display the board's prose stats alongside. The footer SHALL consume design tokens for its surface, borders, and text; stat numbers SHALL render in the monospace font and the accent color.

#### Scenario: Stats rendered
- **WHEN** the page loads
- **THEN** the footer shows computed counts (total shows, counts per service) in monospace accent-colored numbers, the board's original `## QUICK STATS` prose, and all colors adapt to the active theme