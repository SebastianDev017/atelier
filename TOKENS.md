# Atelier V2 — Design Tokens

The token catalog. Static tokens are declared in `assets/base.css`; dynamic tokens
are bridged from theme settings by `snippets/css-variables.liquid`. Component CSS
references tokens only — it never hardcodes a color or size. Pairs with `DESIGN.md`.

> **Provenance.** Values trace to the Playwright scrape of fieldstudiesflora.com
> (see `DESIGN.md §1`) and were cross-checked against a **Google Stitch** design
> system generated from that DESIGN.md — Stitch project `1458587585769970633`,
> design-system asset `c9c9ca3a222444ea8295cab96b02639d` ("Atelier V3"). Stitch
> independently resolved the same three-voice type system (EB Garamond display /
> Literata-or-Lora body / JetBrains-Mono-style labels) and the same palette
> (sand `#D5CDB6`, highlight `#FFF4D7`, hairline `#DDD`, success `#3A7D33`,
> sale `#B23A2E`), confirming the contract before a line of CSS changed.

---

## 1. Dynamic tokens (settings → CSS, via `css-variables.liquid`)

| CSS custom property | Theme setting | Default |
|---|---|---|
| `--font-heading` / `--font-heading-weight` | `heading_font` | EB Garamond / 400 |
| `--font-body` / `--font-body-weight` | `body_font` | Lora / 400 |
| `--color-background` | `background_color` | `#FBF8F2` |
| `--color-foreground` | `text_color` | `#2E3030` |
| `--color-accent` | `accent_color` | `#766356` |
| `--color-border-setting` | `border_color` | `#E3DCCE` |
| `--color-button` | `button_color` | `#2E3030` |
| `--color-button-text` | `button_text_color` | `#FBF8F2` |
| `--page-width` | `page_width` | `1540px` |
| `--page-margin` | `page_margin` | `40px` |
| `--header-height` | `header_height` | `64px` |
| `--section-spacing` | `section_spacing` | `140px` |
| `--radius-inputs` | `input_corner_radius` | `0px` |
| `--heading-scale` | `heading_scale` | `1` (100%) |
| `--body-scale` | `body_scale` | `1` (100%) |
| `--uppercase-headings` | `uppercase_headings` | `none` |
| `--uppercase-nav` | `uppercase_nav` | `uppercase` |
| `--uppercase-buttons` | `uppercase_buttons` | `uppercase` |

`--font-mono` is **static** (not a setting) — see §2 — so the monospace label voice
can never silently fall back or trip the `font_face`/`font_url` rule.

---

## 2. Color (static + derived, `base.css`)

```
--color-white            #ffffff      (anchor — only raw white allowed)
--color-black            #0a0705      (anchor — only raw black allowed)
--color-bg               = --color-background        (#FBF8F2 default)
--color-text             = --color-foreground        (#2E3030 default)
--color-accent-local     = --color-accent            (#766356 default)
--color-border           = --color-border-setting, else text @ 12%
--color-border-strong    = text @ 32%
--color-muted            = text @ 58%   (≈ scrape #727272)
--color-subtle           = text @ 6%
--color-media            = text mixed 5% into bg   (the pale "plate" products float on)
--color-overlay-text     = --color-background        (text painted over hero imagery)

Brand constants (shared by every preset, straight from the scrape):
--color-sand             #D5CDB6      (soft section fills, free-ship bar)
--color-highlight        #FFF4D7      (notice / new-in / low-stock badge ground)
--color-success          #3A7D33
--color-sale             #B23A2E      (sale price + error)
```

Buttons resolve to: background `--color-button`, label `--color-button-text`,
hover `--color-accent-local`. The `.color-scheme--invert` block re-derives
`--color-border` and flips `--color-button`/`--color-button-text` for legibility.

---

## 3. Type voices — three fonts, three jobs

```
--font-heading   EB Garamond (eb_garamond_n4)  → .h0–.h5, h1–h6, product titles
--font-body      Lora (lora_n4)                → body copy, nav links, rich text
--font-mono      ui-monospace, SFMono-Regular, 'SF Mono', 'JetBrains Mono',
                 Menlo, Consolas, monospace     → eyebrows, vendor, price, buttons,
                                                  utility labels, index numerals
```

Stitch alternates: body → **Literata** (`literata_n4`), labels → **JetBrains Mono**.
Both are valid swaps in Theme settings; the shipped defaults (Lora + system mono)
are the most reliable across the Shopify font library and zero-font-load.

---

## 4. Spacing scale (n × 0.25rem)

```
--space-1 .25rem   --space-2 .5rem    --space-3 .75rem   --space-4 1rem
--space-5 1.25rem  --space-6 1.5rem   --space-8 2rem     --space-10 2.5rem
--space-12 3rem    --space-16 4rem    --space-20 5rem    --space-24 6rem   --space-32 8rem
```

Reference rhythm (Stitch): section-v desktop **180px**, mobile **140px**, gutter
**24px**, side margin **40px**, max-width **1540px** — encoded as the layout
defaults below.

---

## 5. Type scale (fluid clamp, × scale setting)

```
--text-xs   .6875rem (11px)  eyebrows / labels (mono)
--text-sm   .8125rem (13px)
--text-base clamp(.95rem, .9rem + .2vw, 1.0625rem)   (~16–17px, matches Stitch body 17px)
--text-md   1.125rem          (lead, 18px)
--text-lg   clamp(1.2rem, 1.05rem + .55vw, 1.5rem)
--text-xl   clamp(1.45rem, 1.2rem + 1vw, 2rem)        (≈ h4)
--text-2xl  clamp(1.85rem, 1.35rem + 1.9vw, 2.75rem)  (≈ h3 32px)
--text-3xl  clamp(2.3rem, 1.6rem + 2.9vw, 3.6rem)     (≈ h2 48px)
--text-4xl  clamp(2.9rem, 1.85rem + 4.6vw, 4.8rem)
--text-5xl  clamp(3.4rem, 2rem + 6.5vw, 6.2rem)       (≈ h1 84px)
--text-6xl  clamp(3.8rem, 2rem + 8.5vw, 7.5rem)       (≈ h0 120px)

--leading-tight 1.08   --leading-snug 1.25   --leading-normal 1.6   --leading-relaxed 1.75
--tracking-label .15em   --tracking-wide .05em   --tracking-tight -.01em
```

Display `.h0/.h1` carry −0.02em tracking (Stitch h0 letter-spacing −0.02em).

---

## 6. Motion

```
--duration-fast   250ms   (text, buttons, micro-interactions)
--duration-base   300ms
--duration-slow   400ms   (images)
--duration-slower 600ms   (image zoom, hero rise)
--ease-editorial  cubic-bezier(0.22, 0.61, 0.36, 1)
--ease-out        cubic-bezier(0.16, 1, 0.3, 1)
```

---

## 7. Radius, aspect ratios, layout, z-index

```
--radius-none 0    --radius-inputs 0px (setting)   --radius-pill 999px

--ratio-product 4/5   --ratio-square 1/1   --ratio-portrait 4/5
--ratio-landscape 4/3 --ratio-wide 16/9

--page-width 1540px   --page-margin 40px   --page-width-narrow 52rem
--header-height 64px  --section-spacing 140px
--grid-gutter clamp(.75rem, .4rem + 1.2vw, 1.75rem)

--z-base 1  --z-raised 10  --z-sticky 80  --z-header 100
--z-overlay 200  --z-drawer 210  --z-skip 300
```

---

## 8. Preset value matrix

| Setting | Atelier (default) | Gallery | Botanic |
|---|---|---|---|
| heading_font | eb_garamond_n4 | playfair_display_n4 | libre_baskerville_n4 |
| body_font | lora_n4 | lora_n4 | eb_garamond_n4 |
| background_color | #FBF8F2 | #FFFFFF | #EDE7DA |
| text_color | #2E3030 | #1A1A1A | #33352F |
| accent_color | #766356 | #5A5A5A | #6B7257 |
| border_color | #E3DCCE | #E6E6E6 | #D2C9B6 |
| button_color | #2E3030 | #1A1A1A | #33352F |
| button_text_color | #FBF8F2 | #FFFFFF | #EDE7DA |
| heading_scale | 100 | 105 | 100 |
| uppercase_headings | false | true | false |
| uppercase_nav | true | true | false |
| uppercase_buttons | true | true | false |
| page_width | 1540 | 1640 | 1460 |
| page_margin | 40 | 48 | 36 |
| section_spacing | 140 | 144 | 132 |
| header_height | 64 | 60 | 68 |
| input_corner_radius | 0 | 0 | 0 |

---

## 9. Section / component mockups

The rendered section references for **hero, product card, product page,
collection grid, and cart drawer** are delivered as the self-contained
`preview.html` (Deliverable 1) — it renders each component with realistic content
in both desktop and mobile viewports using these exact tokens, and doubles as the
client-facing design reference. The Stitch design system asset
(`c9c9ca3a222444ea8295cab96b02639d`) is the upstream visual source of truth.
