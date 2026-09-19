## Why

The current site ships a light, generic palette and a sticky pill bar that overflows horizontally on mobile, making category navigation fiddly on phones. Adopting the Vercel design language (dark minimal, monochrome + mesh-gradient accent) gives the guide a deliberate, on-brand identity, and collapsing the category list into a hamburger menu on small screens makes mobile navigation usable.

## What Changes

- **BREAKING** (visual only): Default theme becomes dark. The light palette is replaced by a Vercel-inspired dark token set (`#000` canvas, `#ededed` ink, `#1a1a1a` surfaces, `#333` hairlines, `0.625rem` radius, monospace labels for technical metadata, mesh-gradient accent reserved for hero/header).
- **New** design token system in `src/styles/tokens.css` covering both dark (default) and light (optional) palettes, exposed as CSS custom properties consumed by all components.
- **New** optional light-mode toggle in the header (a small icon button). Dark mode is default; the toggle persists via `localStorage` and a `data-theme` attribute on `<html>`. No FOUC thanks to an inline blocking script in `<head>`.
- **BREAKING** (behavior): Category navigation is restructured. On viewports < 768px the category list collapses into a hamburger menu (slide-down panel listing categories with counts, scrolls to section on tap). On ≥ 768px the inline pill bar remains (sticky, monospace category labels).
- **Modified** `Layout.astro`: new header treatment with mesh-gradient accent band, monospace metadata, theme toggle button, and the mobile-menu toggle button.
- **Modified** `CategoryNav.astro`: renders both a desktop pill bar and a mobile hamburger panel; toggles via a tiny inline script (no framework JS).
- **Modified** `ShowCard.astro`, `CategorySection.astro`, `QuickStats.astro`: restyled against the new dark token set (card surfaces `#1a1a1a`, hairline borders `#333`, category-colored placeholder covers dimmed to match dark canvas, badges in monospace uppercase).
- **No changes** to the parser, enrichment pipeline, deploy workflow, or `boards/Summer 2026.md`.

## Capabilities

### New Capabilities
- `design-tokens`: A centralized token system (CSS custom properties + a small inline theme script) defining the Vercel-inspired dark palette as default, an optional light palette, radius/spacing/typography scales, and the mesh-gradient accent. Consumed by all components. Includes a no-FOUC inline blocking script that applies the persisted theme before first paint.

### Modified Capabilities
- `site-rendering`: The requirements for category navigation, the page layout/header, and show-card/quick-stats styling are changing to reflect the dark default theme, the mobile hamburger menu, and the new token-driven styling. (Existing requirements for responsive grid, self-contained output, configurable base path, and card content are preserved; only nav behavior + visual treatment change.)

## Impact

- **New code**: `src/styles/tokens.css` (design tokens), inline no-FOUC theme script in `Layout.astro` `<head>`, theme-toggle + hamburger-toggle inline scripts (small, vanilla JS).
- **Modified components**: `Layout.astro`, `CategoryNav.astro`, `ShowCard.astro`, `CategorySection.astro`, `QuickStats.astro` — all restyled against tokens; `CategoryNav` gains the mobile menu markup + toggle.
- **No new dependencies**: pure CSS + tiny inline JS. No CSS framework, no theme-switching library.
- **No data/build changes**: parser, enrichment, cache, deploy workflow untouched. `boards/Summer 2026.md` still read-only.
- **Accessibility**: dark mode meets WCAG AA contrast (`#ededed` on `#000` ≈ 16:1). Toggle exposes `aria-label` and `aria-pressed`. Mobile menu exposes `aria-expanded` and is keyboard-dismissable (Esc). Respects `prefers-color-scheme` on first visit (defaults to dark if no stored preference, per the "dark mode default" requirement).
- **Bundle size**: ~1-2KB additional CSS + <1KB inline JS. No runtime fetches added.