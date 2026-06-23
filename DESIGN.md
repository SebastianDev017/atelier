# Atelier V2 — Design Contract

Editorial studio-commerce theme. Warm-cream / cool-charcoal palette, zero
border-radius, **Caslon serif display + warm serif body + monospace micro-labels**,
full-bleed imagery, numbered "index" navigation, generous vertical rhythm.
Built for Shopify Theme Store submission on the new theme architecture
(section groups + theme blocks).

This file is the **visual contract**. Every CSS value in the theme resolves from a
design token (see `TOKENS.md`) that traces back to a value documented here. No
component hardcodes a color or size.

---

## 1. Reference north star — extracted, not guessed

The contract below was reverse-engineered from **fieldstudiesflora.com** with
Playwright on 2026-06-23: computed styles, the site's own `:root` custom
properties, `document.fonts`, and viewport measurement on the homepage and
`/collections/store`. Field Studies Flora is itself a Shopify storefront, so its
patterns map cleanly onto a theme.

What the scrape returned (verbatim from the site's `:root`):

```
--color-background:    #fbf8f2      (warm cream — page + layout)
--color-foreground:    #2e3030      (cool charcoal — NOT a brown)
--menu-colour:         #2e3030
--color-charcoal-750:  #727272      (muted secondary text)
--color-charcoal-500:  #b0b0b0      (tertiary / disabled)
--color-grey:          #dddddd      (hairline rules)
--color-charcoal-cart: #766356      (warm taupe — accent)
--color-charcoal-yellow:#d5cdb6     (sand — soft fills)
--color-yellow:        #fff4d7      (pale highlight — notices/badges)
--color-success:       #3a7d33
--color-error:         #d31d1d
--font-family-caslon-ionic: "Caslon Ionic", Times, serif   (display + nav)
--font-family-henry-np:     "Henry", Georgia, serif        (body, 18px)
--font-family-simon-mono:   "Simon Mono", monospace        (micro-labels, 8–11px)
--header-height: 48px      --inset/--gutter: 16px      --columns: 24
--space-top / --space-bottom: 180px                    (section rhythm)
--ease-out: cubic-bezier(0, 0, .58, 1)
```

Loaded fonts (`document.fonts`): Caslon Ionic, Henry (roman + italic), Simon Mono.

**Signature observations (homepage + store):**

- Full-bleed editorial hero photograph; cream text painted directly over it.
- Left-rail **numbered index nav** — `I. SERVICES`, `II. STORE`, `III. PRESS` …
  Roman numeral in mono, section head in letter-spaced Caslon small-caps, child
  links in serif.
- Product card order: **vendor (mono, uppercase) → title (Caslon serif) →
  status line (serif italic, "Ready to ship") → price (mono, tracked)**. Objects
  float on a pale neutral ground a few percent darker than the page.
- Square corners everywhere (`border-radius: 0`). Buttons are minimal/underline,
  not filled chips. `svh`/`svw` units, not `vh`/`vw`.

These are the contract. Library-font substitutions are documented in §4.

---

## 2. Brand principles

1. **Square, not soft.** Border-radius is 0 on buttons, cards, inputs, modals, badges.
2. **Three voices.** Caslon serif *sings* (display, titles); warm serif *reads* (body);
   monospace *labels* (eyebrows, vendor, price, nav utility, buttons). Never mix the roles.
3. **Cool charcoal, warm cream.** Foreground is `#2E3030` (neutral-cool), never brown.
   Warmth lives in the `#FBF8F2` ground and the `#766356` taupe accent.
4. **Whitespace is the layout.** Section spacing is generous (default 140px → 180px on
   desktop); dividers are hairlines (`#DDD`-weight), never boxes.
5. **Editorial cadence.** Imagery moves slowly (400ms); text/buttons respond briskly (250ms).
6. **Imagery leads.** Full-bleed hero; product imagery floats on a pale ground.
7. **Metadata uses `·`** as a separator — no pipes, no `<hr>`, no bordered chips.
8. **Index voice.** Roman numerals / numeric markers as eyebrows where it reads as a catalog.

---

## 3. Color

Three named presets ship in `config/settings_data.json`, all merchant-editable
under **Theme settings → Colors**.

| Token | Atelier (default) | Gallery | Botanic |
|---|---|---|---|
| Background | `#FBF8F2` | `#FFFFFF` | `#EDE7DA` |
| Text / foreground | `#2E3030` | `#1A1A1A` | `#33352F` |
| Accent (hover/emphasis) | `#766356` | `#5A5A5A` | `#6B7257` |
| Borders & dividers | `#E3DCCE` | `#E6E6E6` | `#D2C9B6` |
| Button background | `#2E3030` | `#1A1A1A` | `#33352F` |
| Button label | `#FBF8F2` | `#FFFFFF` | `#EDE7DA` |

Brand constants (static tokens in `base.css`, every preset shares them — straight
from the scrape):

- `--color-sand` = `#D5CDB6` — soft section fills
- `--color-highlight` = `#FFF4D7` — notice / new-in / low-stock badge ground
- `--color-success` = `#3A7D33`
- `--color-sale` = `#B23A2E` — sale price + error (scrape `#D31D1D`, muted for print-warmth)

Derived (computed in `base.css`, adapt to whichever color-scheme is in scope):

- `--color-border` = setting, else text @ 12%
- `--color-border-strong` = text @ 32% — input borders, blockquote rule
- `--color-muted` = text @ 58% — captions, secondary copy (≈ scrape `#727272`)
- `--color-subtle` = text @ 6% — media placeholders
- `--color-media` = text mixed 5% into bg — the pale ground products float on

Section-level **color schemes** (`cream`, `parchment`, `sand`, `white`, `invert`)
remix the brand palette so each section can shift weight without new colors. The
`invert` scheme re-derives borders and flips button tokens so they stay legible.

---

## 4. Typography

Three type roles, three fonts. The reference uses Caslon Ionic + Henry + Simon
Mono — all proprietary/self-hosted. The library-valid stand-ins below preserve the
*roles and feel*; swap any in **Theme settings → Typography**.

| Role | Reference | Atelier default | Why |
|---|---|---|---|
| Display / headings / product titles | Caslon Ionic | **EB Garamond** | Old-style Caslon-family serif; warm, literary, library-valid |
| Body copy | Henry | **Lora** | Humanist serif, sturdy at 16–18px; echoes Henry's warmth |
| Micro-labels (eyebrow, vendor, price, button, nav utility) | Simon Mono | **System monospace stack** | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` — zero font-load, no `font_face` risk |

> **font_picker note.** Reference fonts are proprietary; the brief's earlier
> Cormorant Garamond + Jost are *not* in Shopify's `font_picker` library (verified
> in the V1 build) and silently fall back. EB Garamond + Lora **are** library
> handles (`eb_garamond_n4`, `lora_n4`). The monospace layer is a static CSS stack
> — it loads no webfont, so it can never fall back or violate the `font_face` rule.

Library fonts load via the **`font_face` filter** with `font_display: swap`
(never `font_url`). Heading font → headings + product titles only; body font →
body copy + nav links; the mono stack → all utility micro-text.

**Type scale** (fluid `clamp()`, × the merchant heading/body scale settings):

- Display `.h0` 3.8→7.5rem · `.h1` 3.4→6.2rem · `.h2` 2.3→3.6rem · `.h3` 1.85→2.75rem · `.h4` 1.45→2rem · `.h5` 1.2→1.5rem
- Body base 0.95→1.0625rem · lead 1.125rem
- **Eyebrows & labels (mono):** 11px (`--text-xs`), uppercase, letter-spacing `0.15em`, weight 400

Line-heights: headings 1.08, body 1.6, rich text 1.75. Heading tracking −0.01em.
Caslon-family display gets −0.02em on `.h0/.h1`. Nav links uppercase, tracked `0.15em`.

---

## 5. Layout

| Token | Default | Gallery | Botanic |
|---|---|---|---|
| Page width (max) | 1540px | 1640px | 1460px |
| Page side margin | 40px | 48px | 36px |
| Section spacing | 140px | 144px | 132px |
| Header height | 64px | 60px | 68px |
| Corner radius | 0 | 0 | 0 |

- Product grid: 2 columns mobile → 4 columns ≥750px, uniform gutter.
- Underlying grid reads as the reference's 24-column field; gutter `clamp(.75rem…1.75rem)`.
- Collection: filters visible (not collapsed) on desktop ≥990px via a sticky 16rem sidebar.
- Split sections: asymmetric (40/60–45/55), never 50/50.
- Header is slim (64px default, can go to 48px) and may overlay the hero transparently.

---

## 6. Motion

- Images: **400ms** (`--duration-slow`) · text & buttons: **250ms** (`--duration-fast`)
- Easing: `--ease-editorial` `cubic-bezier(0.22, 0.61, 0.36, 1)` for interface; `--ease-out` for entrances
- Page navigation: cross-fade via `@view-transition` (200ms out / 250ms in), setting-gated
- All motion collapses under `prefers-reduced-motion: reduce`

---

## 7. Imagery

- Product media floats on `--color-media` ground at `aspect-ratio: 4 / 5`, `object-fit: cover`
- Hero image: full-bleed, `loading="eager"` + `fetchpriority="high"` (the only eager image)
- Every other image: `loading="lazy"`, responsive `srcset` via `image_tag`
- Second product image cross-fades in on card hover (400ms)

---

## 8. Conversion (CRO) — required per surface

- **Hero:** value prop above the fold, single primary CTA, trust line ("4.9 ★ · 2,000+ reviews · Free shipping over $150")
- **Product card:** quick-add (hover desktop / always-visible mobile), second image on hover, sale badge, "Only X left" when stock ≤ threshold
- **Product page block order:** vendor → title → rating → price → variants → quantity → ATC → Shop Pay → shipping line → description → collapsible rows
- **Mobile product page:** `position: fixed; bottom: 0` sticky add-to-cart bar
- **Cart drawer:** free-shipping progress bar, full-width checkout CTA
- **Collection:** best-selling default sort, filters visible on desktop
- **Touch targets:** 44 × 44px minimum on every interactive element

---

## 9. Accessibility (WCAG 2.2 AA)

- `aria-expanded` on every disclosure (menu, search, submenus, collapsibles)
- `aria-live="polite"` on price, cart count, and buy/availability region
- `aria-current="page"` on the active nav link and active pagination item
- Skip link to `#main-content`; visible `:focus-visible` ring (2px, 3px offset)
- Charcoal `#2E3030` on cream `#FBF8F2` = ~12.4:1 contrast (passes AAA body text)
- `loading="eager" fetchpriority="high"` on hero only; `loading="lazy"` elsewhere
- 44 × 44px minimum interactive targets

---

## 10. Page transitions (in `layout/theme.liquid`, setting-gated)

```css
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: 200ms ease both atelier-vt-out; }
::view-transition-new(root) { animation: 250ms ease both atelier-vt-in; }
@keyframes atelier-vt-out { to { opacity: 0; } }
@keyframes atelier-vt-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
}
```
