## ADDED Requirements

### Requirement: Parse seasonal board Markdown into structured show list
The system SHALL parse a board Markdown file at `boards/<season>.md` and produce a structured object containing: season title, metadata line (last-updated + sources), and an ordered list of categories. Each category SHALL contain an ordered list of shows. Each show SHALL expose: title, raw URL string from the file, blurb text, and any parenthetical markers (e.g. `*(continuing)*`, `*(movie)*`).

#### Scenario: Well-formed board file
- **WHEN** the parser is given `boards/Summer 2026.md` with H1 title, italic metadata, `## Category` sections, and `- **Title**` bullets each followed by an indented URL line and an indented blurb
- **THEN** the parser returns `{ seasonTitle, metadata, categories: [{ name, shows: [{ title, rawUrl, blurb, markers }] }] }` preserving source order

#### Scenario: Show with no URL line
- **WHEN** a `- **Title**` bullet is followed immediately by a blurb with no indented URL line
- **THEN** the parser sets `rawUrl` to an empty string and still captures the blurb

#### Scenario: Show with no blurb
- **WHEN** a `- **Title**` bullet has a URL line but no indented blurb text
- **THEN** the parser sets `blurb` to an empty string and still captures the URL

#### Scenario: Title with parenthetical marker
- **WHEN** a title bullet contains a trailing `*(continuing)*` or `*(movie)*` marker
- **THEN** the parser strips the marker from `title` and adds it to a `markers` array on the show

#### Scenario: Extra blank lines or stray text
- **WHEN** the board file contains extra blank lines between sections or stray non-bullet text outside categories
- **THEN** the parser ignores stray text and preserves the structured show list without throwing

### Requirement: Identify placeholder URLs
The system SHALL flag any parsed URL that matches a known placeholder pattern (e.g. Crunchyroll series ID `GDKHZEJPQ`, or Netflix title IDs of the form `THE_RIBBON_HERO` / `THUNDER3` / `POKEMON_HORIZONS`) as `unresolved: true` on the show, leaving `rawUrl` intact for traceability.

#### Scenario: Placeholder Crunchyroll ID
- **WHEN** a show's `rawUrl` contains the series ID `GDKHZEJPQ`
- **THEN** the show is marked `unresolved: true`

#### Scenario: Real Crunchyroll ID
- **WHEN** a show's `rawUrl` contains a non-placeholder Crunchyroll series ID (e.g. `G24H1N3MP`)
- **THEN** the show is marked `unresolved: false`

### Requirement: Parser does not modify the source file
The parser SHALL read `boards/<season>.md` read-only and SHALL NOT write to it at any point.

#### Scenario: Build run
- **WHEN** a build is executed against `boards/Summer 2026.md`
- **THEN** the file `boards/Summer 2026.md` is byte-for-byte unchanged after the build completes

### Requirement: Parser is tolerant of unknown category names
The parser SHALL accept any `## <Name>` header as a category without an enum of allowed names, so humans can rename categories freely.

#### Scenario: Renamed category
- **WHEN** a board file uses `## ISEKAI STUFF` instead of `## ISEKAI`
- **THEN** the parser returns a category with `name: "ISEKAI STUFF"` and its shows