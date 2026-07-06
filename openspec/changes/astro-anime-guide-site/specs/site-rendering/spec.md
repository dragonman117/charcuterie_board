## ADDED Requirements

### Requirement: Render mobile-first static site from enriched guide
The system SHALL render a static HTML site from the parsed + enriched guide data using Astro. The site SHALL be mobile-first: single-column layout on viewports < 640px, expanding to 2 columns at ≥ 640px and 3 columns at ≥ 1024px. The site SHALL consist of a single season page rendering all categories.

#### Scenario: Mobile viewport
- **WHEN** the page is viewed at a 375px width
- **THEN** show cards render in a single column with readable typography, tappable cover art, and no horizontal scroll

#### Scenario: Desktop viewport
- **WHEN** the page is viewed at a 1280px width
- **THEN** show cards render in a 3-column grid

### Requirement: Category navigation
The page SHALL render a sticky top navigation listing all categories in source order. Each nav item SHALL link to the corresponding category section via anchor. The current category SHALL be highlighted as the user scrolls (via a small inline script or CSS scroll-spy).

#### Scenario: Category nav rendered
- **WHEN** the page loads
- **THEN** a sticky nav bar shows all category names and clicking one scrolls to that section

### Requirement: Show card content
Each show SHALL render as a card containing: cover image (or placeholder), title, blurb text, and a clickable link to the resolved streaming URL (or "link TBA" + search fallback when unresolved). Continuing shows SHALL display a "Continuing" badge; movies SHALL display a "Movie" badge.

#### Scenario: Resolved show card
- **WHEN** a show has `source: "anilist"` or `"jikan"` and a valid `coverPath`
- **THEN** the card shows the local cover image, title, blurb, and a link labeled with the streaming service name pointing to `resolvedUrl`

#### Scenario: Unresolved show card
- **WHEN** a show has `source: "unresolved"`
- **THEN** the card shows a placeholder cover (category-colored), title, blurb, and a "Link TBA" link pointing to the search fallback URL

#### Scenario: Continuing show badge
- **WHEN** a show's `markers` includes `continuing`
- **THEN** the card displays a "Continuing" badge near the title

### Requirement: Quick stats footer
The page SHALL render a footer section with the quick-stats from the board file (total shows, new series, sequels, per-service counts). The renderer SHALL compute these counts from the parsed data rather than trusting the board's prose, and SHALL display the board's prose stats alongside.

#### Scenario: Stats rendered
- **WHEN** the page loads
- **THEN** the footer shows computed counts (total shows, counts per service) and the board's original `## QUICK STATS` prose

### Requirement: Self-contained output with no runtime external requests
The built site SHALL make no runtime requests to AniList, Jikan, or any streaming service CDN. All cover images SHALL be served from the site's own `/covers/` path. All links to streaming services SHALL be user-clicked navigations, not preloaded.

#### Scenario: Offline page load
- **WHEN** the built site is opened with no network connection
- **THEN** all cover images load from local assets and the page is fully usable

### Requirement: Configurable base path
The renderer SHALL honor a `BASE_PATH` environment variable for the Astro `base` config, and all internal links/asset references SHALL resolve correctly under that base. Default `BASE_PATH` SHALL be `/`.

#### Scenario: Project Pages base path
- **WHEN** `BASE_PATH=/charcuterie_board/` is set at build time
- **THEN** all asset URLs and internal links are prefixed with `/charcuterie_board/` and the site works at `https://<user>.github.io/charcuterie_board/`

#### Scenario: Root base path
- **WHEN** `BASE_PATH` is unset at build time
- **THEN** the site works at a root domain with no path prefix