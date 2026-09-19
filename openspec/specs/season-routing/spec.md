# Season Routing Specification

## Purpose

Derives one browsable page per season board from `boards/*.md` plus a season index at the site root, so multiple seasons coexist and no season code is hardcoded per release.

## Requirements

### Requirement: One page per season board
The system SHALL render one static page per Markdown board file found under `boards/`, at the URL `/<season-slug>/`, where `<season-slug>` is derived from the board's H1 season title (e.g. `Fall 2026 Anime Guide` → `fall-2026`). Adding or removing a board file SHALL automatically add or remove the corresponding page without code changes.

#### Scenario: Two boards present
- **WHEN** `boards/` contains `Fall 2026.md` and `Summer 2026.md` at build time
- **THEN** the build produces `/fall-2026/` and `/summer-2026/` pages, each rendering its own board's categories, shows, and quick stats

#### Scenario: Season page renders existing layout
- **WHEN** a season page is opened
- **THEN** it renders the same structure as the previous single-season page: sticky category nav (hamburger on mobile), category sections with show cards, quick-stats footer, theme toggle, and correct asset paths under the configured `BASE_PATH`

### Requirement: Season index at site root
The site root `/` SHALL render an index of all seasons, newest first. Each entry SHALL show the season's display title, its board metadata line (last-updated/sources), and its show count, and SHALL link to the season page. The most recent season SHALL be visually marked as current.

#### Scenario: Index lists both seasons
- **WHEN** the site root is opened and `boards/` contains Fall 2026 and Summer 2026
- **THEN** the index lists Fall 2026 (marked current) above Summer 2026, each with title, metadata, show count, and a link to `/<season-slug>/`

#### Scenario: Season order derivation
- **WHEN** boards exist for multiple seasons
- **THEN** seasons are ordered by their chronological season date (newest first), derived from the season title or filename, not from a hardcoded list

### Requirement: Season switcher in header
Every page (index and season pages) SHALL include a season switcher in the header that links to every season page plus the index. On viewports < 768px it SHALL be a compact control (e.g. `<select>`); on ≥ 768px it SHALL be inline links. The current season SHALL be indicated as active.

#### Scenario: Switching seasons on mobile
- **WHEN** a season page is viewed at 375px and the user picks another season from the switcher
- **THEN** the browser navigates to that season's page

#### Scenario: Switcher shows current season
- **WHEN** `/fall-2026/` is viewed
- **THEN** the switcher marks Fall 2026 as active and lists Summer 2026 and the index as the other destinations

### Requirement: Default landing behavior
The site SHALL NOT hardcode any season in code. The page content for each season SHALL be fully derived from its board file at build time. The newest season's page is reachable from the root index in one click.

#### Scenario: New season added next cycle
- **WHEN** a future `boards/Winter 2027.md` is added (no code edits)
- **THEN** the build produces `/winter-2027/`, the index lists it first as current, and the switcher includes it