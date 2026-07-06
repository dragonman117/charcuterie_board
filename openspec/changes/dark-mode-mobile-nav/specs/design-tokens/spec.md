## ADDED Requirements

### Requirement: Centralized design token system
The system SHALL provide a single `src/styles/tokens.css` file defining all design tokens as CSS custom properties on `:root`. Tokens SHALL cover: background, surface, surface-alt, text, muted, border, accent, accent-link, radius, font-sans, font-mono, and the mesh-gradient accent. All components SHALL consume tokens via `var(--*)` and SHALL NOT hardcode color/radius/font values.

#### Scenario: Component uses tokens
- **WHEN** any component's `<style>` block sets a color, radius, or font-family
- **THEN** the value references a `var(--*)` token defined in `tokens.css` rather than a literal hex, pixel-radius, or font stack

#### Scenario: Single source of truth
- **WHEN** a token value needs to change
- **THEN** editing the single entry in `tokens.css` updates every consuming component without per-component edits

### Requirement: Dark mode is the default theme
The `:root` token values SHALL define the dark palette: `--bg: #000000`, `--surface: #1a1a1a`, `--surface-alt: #141414`, `--text: #ededed`, `--muted: #a1a1a1`, `--border: #333333`, `--accent: #ededed`, `--accent-link: #a1a1a1`, `--radius: 0.625rem`. Dark mode SHALL apply whenever no `[data-theme]` attribute is present on `<html>`.

#### Scenario: First paint with no stored preference and no OS light signal
- **WHEN** the page loads for a first-time visitor with no `localStorage.theme` and `prefers-color-scheme` is not `light`
- **THEN** the dark palette is applied and no flash of light theme is visible

### Requirement: Optional light theme via data-theme attribute
The system SHALL define a `[data-theme="light"]` selector that overrides the dark tokens with the light palette: `--bg: #ffffff`, `--surface: #ffffff`, `--surface-alt: #fafafa`, `--text: #171717`, `--muted: #666666`, `--border: #ebebeb`, `--accent: #171717`, `--accent-link: #4d4d4d`. Setting `document.documentElement.dataset.theme = "light"` SHALL switch the entire site to the light theme.

#### Scenario: Light theme activated
- **WHEN** `<html data-theme="light">` is set
- **THEN** every component renders with the light palette

#### Scenario: Light theme deactivated
- **WHEN** the `data-theme` attribute is removed or set to `dark`
- **THEN** every component renders with the dark palette

### Requirement: No flash of incorrect theme (FOUC prevention)
The system SHALL include a synchronous inline `<script>` in the `<head>` of every page that runs before the stylesheet applies. The script SHALL: read `localStorage.getItem('theme')`; if present, set `document.documentElement.dataset.theme` to the stored value; if absent, set it to `light` only when `(matchMedia('(prefers-color-scheme: light)')).matches`, otherwise leave it unset (dark default). The script SHALL NOT be deferred or async-loaded.

#### Scenario: First paint is dark for a dark-default user
- **WHEN** a first-time visitor with `prefers-color-scheme: dark` (or no signal) loads the page
- **THEN** the first painted frame uses the dark palette and no light-theme flash occurs

#### Scenario: Returning user gets their stored theme
- **WHEN** a visitor with `localStorage.theme = "light"` loads the page
- **THEN** the first painted frame uses the light palette and no dark-theme flash occurs

### Requirement: Theme toggle control
The header SHALL render a theme-toggle `<button>` with inline SVG icons (sun in dark mode, moon in light mode). Clicking the button SHALL flip `data-theme` between `dark` and `light`, persist the choice to `localStorage.theme`, and update the icon. The button SHALL expose `aria-pressed` reflecting whether dark mode is active and an `aria-label` describing the action ("Switch to light theme" / "Switch to dark theme").

#### Scenario: User switches to light
- **WHEN** the page is in dark mode and the user clicks the theme toggle
- **THEN** `<html data-theme="light">` is set, `localStorage.theme` becomes `"light"`, the button icon becomes a moon, and `aria-pressed` becomes `"false"`

#### Scenario: User switches back to dark
- **WHEN** the page is in light mode and the user clicks the toggle
- **THEN** `data-theme` is removed (or set to `dark`), `localStorage.theme` becomes `"dark"`, the icon becomes a sun, and `aria-pressed` becomes `"true"`

#### Scenario: Toggle is keyboard-operable
- **WHEN** the user focuses the toggle and presses Enter or Space
- **THEN** the theme switches exactly as on click

### Requirement: Mesh-gradient accent reserved for header scale
The token `--mesh` SHALL define a multi-color linear gradient (`135deg, #0070f3, #7928ca, #ff0080, #f5a623`). Its use SHALL be restricted to the header accent band and the theme-toggle focus ring. Cards, category sections, and quick-stats SHALL NOT use the mesh gradient on their surfaces.

#### Scenario: Mesh gradient appears only in header
- **WHEN** the page renders
- **THEN** the mesh gradient is visible only as a thin band under the header title and (on focus) around the theme toggle; no card or section surface uses it

### Requirement: Monospace labels for technical metadata
Metadata, category counts, badges, and nav pill labels SHALL render in `var(--font-mono)` (ui-monospace stack). Headlines and body copy SHALL render in `var(--font-sans)`.

#### Scenario: Badge styling
- **WHEN** a "Continuing" or "Movie" badge renders
- **THEN** its `font-family` is `var(--font-mono)` and its text is uppercase with letter-spacing

### Requirement: Both themes meet WCAG AA contrast
The dark palette (`#ededed` text on `#000000` background) and the light palette (`#171717` text on `#ffffff` background) SHALL each achieve at least 7:1 contrast for body text against the canvas. Muted text (`#a1a1a1` on `#000`; `#666666` on `#fff`) SHALL achieve at least 4.5:1.

#### Scenario: Dark mode contrast
- **WHEN** the dark theme is active
- **THEN** body text contrast ≥ 7:1 and muted text contrast ≥ 4.5:1 against their backgrounds

#### Scenario: Light mode contrast
- **WHEN** the light theme is active
- **THEN** body text contrast ≥ 7:1 and muted text contrast ≥ 4.5:1 against their backgrounds