## MODIFIED Requirements

### Requirement: Render mobile-first static site from enriched guide
The system SHALL render a static HTML site from the parsed + enriched guide data using Astro. The site SHALL be mobile-first: single-column layout on viewports < 640px, expanding to 2 columns at ≥ 640px and 3 columns at ≥ 1024px. The site SHALL consist of a season index page at the root plus one season page per board under `boards/`, each season page rendering all of that board's categories.

#### Scenario: Mobile viewport
- **WHEN** a season page is viewed at a 375px width
- **THEN** show cards render in a single column with readable typography, tappable cover art, and no horizontal scroll

#### Scenario: Desktop viewport
- **WHEN** a season page is viewed at a 1280px width
- **THEN** show cards render in a 3-column grid

#### Scenario: Season index rendered
- **WHEN** the site root is viewed
- **THEN** an index of all seasons renders (newest first, current season marked), each entry linking to its season page

### Requirement: Quick stats footer
The page SHALL render a footer section with the quick-stats from the board file (total shows, new series, sequels, per-service counts). The renderer SHALL compute these counts from the parsed data rather than trusting the board's prose, and SHALL display the board's prose stats alongside. Per-service detection SHALL recognize all services appearing in the boards, including Crunchyroll, HIDIVE, Netflix, Disney+, and Prime Video.

#### Scenario: Stats rendered
- **WHEN** the page loads
- **THEN** the footer shows computed counts (total shows, counts per service) and the board's original `## QUICK STATS` prose

#### Scenario: Disney+ and Prime Video shows counted
- **WHEN** a season board contains shows whose links point to `disneyplus.com` and `primevideo.com` (or amazon.com video pages)
- **THEN** those shows are counted under Disney+ and Prime Video service pills respectively rather than lumped into Other

### Requirement: Configurable base path
The renderer SHALL honor a `BASE_PATH` environment variable for the Astro `base` config, and all internal links/asset references SHALL resolve correctly under that base, including links between the season index, season pages, and covers. Default `BASE_PATH` SHALL be `/`.

#### Scenario: Project Pages base path
- **WHEN** `BASE_PATH=/charcuterie_board/` is set at build time
- **THEN** all asset URLs and internal links — including season-switcher links, index-to-season links, and cover images — are prefixed with `/charcuterie_board/` and the site works at `https://<user>.github.io/charcuterie_board/`

#### Scenario: Root base path
- **WHEN** `BASE_PATH` is unset at build time
- **THEN** the site works at a root domain with no path prefix