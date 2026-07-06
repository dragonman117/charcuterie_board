## Context

The site is built (change `astro-anime-guide-site`, applied) with Astro, mobile-first, GitHub Pages deployable. Current styling lives inline in `Layout.astro` (global `:root` tokens + base CSS) and per-component `<style>` blocks, using a light slate palette (`--bg: #fafafa`, `--surface: #fff`, `--text: #0f172a`, `--accent: #7c3aed`). `CategoryNav.astro` renders a sticky horizontal pill bar that overflows on mobile (scroll-x). There is no theme system and no mobile menu.

The user wants the Vercel design language from designmd.co/d/vercel applied: dark minimal, monochrome, monospace technical labels, `0.625rem` radius, mesh-gradient accent reserved for hero scale. Dark mode must be the default. The category list must collapse to a hamburger menu on mobile.

Constraints:
- No CSS framework, no JS framework. Pure CSS custom properties + tiny inline vanilla JS.
- No runtime external requests added. Self-contained static output preserved.
- No changes to parser/enrichment/deploy.
- WCAG AA contrast in both themes.

## Goals / Non-Goals

**Goals:**
- Centralized design token system (dark default + optional light) consumed by all components.
- Dark mode default with no FOUC, optional user toggle persisted to `localStorage`, respecting `prefers-color-scheme` on first visit (but defaulting to dark if no OS signal).
- Mobile category nav as a hamburger slide-down panel (< 768px); desktop pill bar retained (≥ 768px) with monospace labels.
- All components restyled against the Vercel dark palette: `#000` canvas, `#1a1a1a` surfaces, `#ededed` ink, `#a1a1a1` mute, `#333` hairlines, mesh-gradient accent band in the header.
- Maintain the existing responsive 1→2→3 column card grid, self-contained output, and configurable `BASE_PATH`.

**Non-Goals:**
- No full design-system refactor (no Storybook, no token pipeline, no Tailwind/shadcn). Just one `tokens.css` + per-component CSS.
- No animations beyond the existing hover lifts and the menu slide (no motion system).
- No multi-page routing or theming per-category.
- No server-side theming. Theme is resolved client-side via inline blocking script + `data-theme`.
- No re-architecting the card grid or quick-stats logic.

## Decisions

### D1: Single `src/styles/tokens.css` with `:root` (dark) + `[data-theme="light"]` overrides
**Choice:** One CSS file defining all tokens on `:root` as the dark defaults, with `[data-theme="light"]` selectors overriding to the light palette. Components consume `var(--*)` only — never hardcode colors.
**Why:** Keeps the contract simple (one source of truth), lets the inline theme script flip a single attribute on `<html>`, and avoids FOUC because the blocking script sets the attribute before CSS parses. Vercel's published tokens are light; we invert to dark as default and keep light as the opt-in.
**Alternatives:** `prefers-color-scheme` media query only (can't honor a user's explicit toggle choice); two separate stylesheets (drift risk); CSS-in-JS (no framework, overkill).

### D2: Dark-first token values (Vercel-inspired)
**Choice (dark default):**
- `--bg: #000000`, `--surface: #1a1a1a`, `--surface-alt: #141414`, `--text: #ededed`, `--muted: #a1a1a1`, `--border: #333333`, `--accent: #ededed` (monochrome — accent is ink-on-black, not a hue).
- Mesh-gradient accent (`--mesh: linear-gradient(135deg, #0070f3, #7928ca, #ff0080, #f5a623)`) reserved for the header band and the theme-toggle focus ring only.
- `--radius: 0.625rem` (Vercel's value).
- Typography: `--font-sans: ui-sans-serif, system-ui, ...` for body/headlines; `--font-mono: ui-monospace, SFMono-Regular, Menlo, monospace` for technical labels (metadata, badges, counts, nav pills).
**Choice (light opt-in via `[data-theme="light"]`):**
- `--bg: #ffffff`, `--surface: #ffffff`, `--surface-alt: #fafafa`, `--text: #171717`, `--muted: #666666`, `--border: #ebebeb`, `--accent: #171717`. Mesh gradient unchanged.
**Why:** Matches Vercel's published tokens (`#171717` ink, `#fafafa` canvas-soft, `#ebebeb` hairline, `0.625rem` radius) while inverting to the dark default the user asked for. Monochrome accent (ink, not a hue) is the Vercel signature; the mesh gradient is the only color.
**Alternatives:** Keep `#7c3aed` purple accent (off-brand); introduce a blue accent (drifts from monochrome); use Vercel's light tokens as default (rejects user requirement).

### D3: No-FOUC inline blocking script in `<head>`
**Choice:** A ~10-line inline `<script>` in `Layout.astro`'s `<head>` runs before CSS parses: reads `localStorage.getItem('theme')`; if absent, falls back to `prefers-color-scheme: light` → light, else dark (dark is the explicit default when no stored choice and no OS light signal). Sets `document.documentElement.dataset.theme` accordingly. The toggle button later flips the attribute and writes to `localStorage`.
**Why:** Avoids the flash-of-light-then-dark that would otherwise occur if theme resolution happened after first paint. Inline + blocking guarantees the attribute is set before the stylesheet's `[data-theme]` selectors apply.
**Alternatives:** `<script is:inline>` in body (FOUC); a cookie + server render (no SSR here); `prefers-color-scheme` only (no user toggle persistence).

### D4: Mobile nav = hamburger slide-down panel
**Choice:** `CategoryNav.astro` renders two elements: a desktop `<nav class="catnav-pills">` (visible ≥ 768px) and a mobile `<div class="catnav-mobile">` with a hamburger button + a panel that slides down (CSS `max-height` transition, no position-fixed overlay — it pushes content below the sticky header). The panel lists categories with counts in monospace; tapping a category scrolls to the section and closes the panel. A small inline script toggles `aria-expanded` and a `.open` class. Esc closes.
**Why:** On-brand for Vercel (hamburger + slide-down), keeps the page flow simple (no modal overlay, no backdrop), works without a framework, and the scroll-to-anchor already works via `href="#slug"`. The `<768px` breakpoint matches Tailwind's `md` and gives pills enough room on tablets.
**Alternatives:** `<select>` dropdown (more minimal but loses the count badges and monospace styling); a fixed full-screen overlay (heavier, traps scroll); a bottom-sheet (less common on desktop-oriented brands).

### D5: Theme toggle = icon button in header, `aria-pressed` + `aria-label`
**Choice:** A `<button class="theme-toggle">` in the header showing a sun icon (in dark mode, offers "switch to light") and a moon icon (in light mode). Inline SVG, no icon font. Toggles `data-theme` and writes `localStorage`. `aria-pressed` reflects current state; `aria-label` updates ("Switch to light theme" / "Switch to dark theme").
**Why:** Minimal, accessible, no dependency. Lives in the header next to the hamburger so both controls are grouped.
**Alternatives:** A segmented toggle (heavier); a footer-only toggle (less discoverable); no toggle (rejects the optional-light-mode goal).

### D6: Component restyle strategy = replace hardcoded colors with token vars
**Choice:** Each component's `<style>` block is updated to reference `var(--*)` tokens instead of literal hexes. Placeholder cover colors (the per-category palette in `ShowCard`) are dimmed: in dark mode the palette maps to muted tones derived from the mesh gradient hues at ~30% lightness, so placeholders still differentiate categories without breaking the monochrome canvas.
**Why:** Single source of truth (D1) means theme switching works automatically across every component. No duplicated palettes to drift.
**Alternatives:** Restyle each component with literal dark hexes (no theme switch possible); a separate dark stylesheet (drift).

### D7: No new dependencies
**Choice:** No npm additions. Inline SVG icons, inline vanilla JS (~40 lines total across theme + menu scripts), one new CSS file.
**Why:** Keeps the static bundle tiny and the deploy workflow unchanged.
**Alternatives:** Add `@iconify/astro` (overkill for 2 icons); add a theme library (overkill).

## Risks / Trade-offs

- [FOUC if the inline script fails to run] → Script is synchronous and inline in `<head>`; it cannot be deferred. Worst case (JS disabled) the `:root` dark defaults apply, which is the desired default anyway.
- [User's `prefers-color-scheme: light` overrides the "dark default" requirement] → The script only uses `prefers-color-scheme` to pick the *first-visit* theme when no stored choice exists; dark is the fallback when the OS signal is absent or dark. Once the user toggles, their choice wins forever. This honors both "dark default" and "respect OS" without contradiction.
- [Mobile menu pushes content down instead of overlaying] → Intentional: simpler, no backdrop, no scroll-lock. Trade-off: the page shifts when the menu opens. Acceptable for a nav menu; if it feels jarring, a `position: sticky` header with the panel inside it keeps the shift minimal.
- [Mesh gradient as accent could look loud on the dark canvas] → Restrict it to a single thin band under the header title and the toggle focus ring; never on cards or large surfaces. Vercel uses it the same way (hero-scale only).
- [Monochrome accent (`#ededed` on `#000`) may feel too stark for links] → Links get an underline-on-hover treatment and a slightly muted `--accent-link: #a1a1a1` so they don't compete with body text. The pure-ink accent is reserved for primary buttons/badges.
- [Existing light-theme users (none yet — site is new) get a visual break] → No migration needed; the previous light styling is replaced in place. No users to notify.

## Migration Plan

1. Add `src/styles/tokens.css` and import it once from `Layout.astro`'s frontmatter (Astro bundles it into the global stylesheet).
2. Add the no-FOUC inline script + theme toggle to `Layout.astro`.
3. Restyle `Layout.astro`, `CategoryNav.astro`, `ShowCard.astro`, `CategorySection.astro`, `QuickStats.astro` against tokens (replace literal hexes with `var(--*)`).
4. Add the mobile menu markup + toggle script to `CategoryNav.astro`.
5. Build, preview at 375px / 768px / 1280px, verify both themes.
6. Deploy as usual — no build or deploy workflow changes.

**Rollback:** Revert the component changes and delete `tokens.css`. Since this is a pre-production site with no archived spec for the old theme, rollback is a simple git revert. No data migration.

## Open Questions

- Whether the mesh-gradient band should also appear on the active category pill (current decision: no — keep pills monochrome; gradient is header-only). Easy to revisit.
- Whether the theme toggle should be hidden on very small screens to save header space (current decision: keep it; it's a 32px button).