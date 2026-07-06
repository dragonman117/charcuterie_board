## 1. Design Token System (`design-tokens` capability)

- [x] 1.1 Create `src/styles/tokens.css` with `:root` dark-default tokens: `--bg:#000`, `--surface:#1a1a1a`, `--surface-alt:#141414`, `--text:#ededed`, `--muted:#a1a1a1`, `--border:#333`, `--accent:#ededed`, `--accent-link:#a1a1a1`, `--radius:0.625rem`, `--font-sans` (system sans stack), `--font-mono` (system mono stack), `--mesh` (135deg, #0070f3, #7928ca, #ff0080, #f5a623)
- [x] 1.2 Add `[data-theme="light"]` overrides in `tokens.css`: `--bg:#fff`, `--surface:#fff`, `--surface-alt:#fafafa`, `--text:#171717`, `--muted:#666`, `--border:#ebebeb`, `--accent:#171717`, `--accent-link:#4d4d4d`
- [x] 1.3 Import `tokens.css` once from `Layout.astro` frontmatter so Astro bundles it into the global stylesheet
- [x] 1.4 Verify no component hardcodes hex/radius/font values after token migration (grep for `#[0-9a-f]{3,6}` and `border-radius:` literals in `src/components/`)

## 2. No-FOUC Theme Script + Toggle (`design-tokens` capability)

- [x] 2.1 Add synchronous inline `<script>` in `Layout.astro` `<head>`: read `localStorage.getItem('theme')`; if `light` set `document.documentElement.dataset.theme='light'`; else if `matchMedia('(prefers-color-scheme: light)').matches` set `light`; else leave unset (dark default). Script must not be `defer`/`async`.
- [x] 2.2 Add a `<button class="theme-toggle">` to the header with inline SVG sun (dark mode) / moon (light mode) icons, `aria-pressed`, and dynamic `aria-label`
- [x] 2.3 Add inline toggle script: on click, flip `data-theme`, write `localStorage.theme`, swap icon, update `aria-pressed`/`aria-label`
- [x] 2.4 Verify no FOUC: load the page with network throttled and confirm the first painted frame matches the resolved theme
- [x] 2.5 Verify `prefers-color-scheme: light` first-visit path yields light; dark-OS + no-storage yields dark; stored choice always wins

## 3. Layout + Header Restyle (`site-rendering` capability)

- [x] 3.1 Replace `Layout.astro` global `:root` block with token consumption (delete the old light palette; tokens.css is now the source)
- [x] 3.2 Restyle `.site-header`: dark surface, hairline border, monospace `.metadata`, add a thin `--mesh` gradient band under the `<h1>`
- [x] 3.3 Restyle `.site-footer` against tokens (border-top, muted text, accent-link)
- [x] 3.4 Group the theme-toggle and hamburger buttons in a `.header-controls` row so both controls sit together
- [x] 3.5 Verify header renders correctly at 375px, 768px, 1280px

## 4. Category Nav: Mobile Hamburger + Desktop Pills (`site-rendering` capability)

- [x] 4.1 In `CategoryNav.astro`, keep the desktop `<nav class="catnav-pills">` but restyle pills with `var(--font-mono)`, token colors, and `var(--radius)`; hide it below 768px
- [x] 4.2 Add a `<button class="catnav-hamburger" aria-expanded="false" aria-controls="catnav-panel">` visible only < 768px, with inline SVG icon
- [x] 4.3 Add `<div class="catnav-panel" id="catnav-panel">` listing categories with monospace counts; CSS transitions `max-height` 0↔content height; `.open` class toggles visibility
- [x] 4.4 Add inline script: hamburger click toggles `.open` on panel + `aria-expanded`; Esc closes; clicking a category link closes the panel and scrolls (native anchor behavior)
- [x] 4.5 Verify panel pushes content (no overlay/backdrop), scrolls to category on tap, and closes on Esc at 375px
- [x] 4.6 Verify desktop pill bar still scrolls horizontally if needed and highlights current section via scroll-spy at 1280px

## 5. Component Restyle Against Tokens (`site-rendering` capability)

- [x] 5.1 `ShowCard.astro`: replace literal hexes with `var(--surface)`, `var(--border)`, `var(--text)`, `var(--muted)`, `var(--accent-link)`, `var(--font-mono)` for badges; `border-radius: var(--radius)`
- [x] 5.2 `ShowCard.astro`: dim the placeholder-cover palette to muted mesh-derived tones (~30% lightness) so placeholders still differentiate categories on the dark canvas
- [x] 5.3 `CategorySection.astro`: restyle `.category-title` and `.grid` gap/border with tokens
- [x] 5.4 `QuickStats.astro`: stat numbers in `var(--font-mono)` + `var(--accent)`; surfaces/borders/text via tokens; service pills via tokens
- [x] 5.5 Verify each component restyles correctly when toggling dark↔light without reload

## 6. Build, Validate, Verify Contrast

- [x] 6.1 Run `npm run build` clean; inspect `dist/` (HTML + CSS + covers, no new runtime requests, no new deps)
- [x] 6.2 Run `npm run preview` at 375px: dark default, hamburger nav, single-column cards, no horizontal scroll
- [x] 6.3 Run `npm run preview` at 768px: pill bar appears, 2-column grid
- [x] 6.4 Run `npm run preview` at 1280px: pill bar, 3-column grid
- [x] 6.5 Toggle light↔ dark and confirm both themes render correctly with no FOUC; refresh and confirm persisted choice
- [x] 6.6 Verify WCAG AA: body text ≥ 7:1 and muted text ≥ 4.5:1 in both themes (manual check against token values: `#ededed`/`#000` ≈ 16:1; `#a1a1a1`/`#000` ≈ 9:1; `#171717`/`#fff` ≈ 18:1; `#666`/`#fff` ≈ 5.7:1)
- [x] 6.7 Confirm `boards/Summer 2026.md` unchanged after build
- [x] 6.8 Confirm no component hardcodes colors (grep `src/components/` for hex literals returns 0 outside the placeholder-cover palette map)