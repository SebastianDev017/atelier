# Atelier — Release Notes

## 4.0.0
- New defining identity: a **vertical left sidebar navigation** — a sticky,
  full-height column rendered as a numbered Roman-numeral index, logo at the
  top and search / account / cart at the foot. Replaces the V3 top header.
- Two-column `site-layout` grid (sidebar + content) with a new `sidebar_width`
  setting (Atelier 220 · Studio 180 · Maison 250); collapses to an off-canvas
  drawer behind a fixed hamburger on mobile.
- Product imagery moves to a 3:4 portrait ratio (design rule 6).
- Reuses the unchanged `<header-component>` JS so menu/search/cart behavior and
  focus trapping carry over intact.
- Still passes Shopify Theme Check with 0 offenses; validated via the Shopify Dev MCP.

## 3.0.0
- New editorial identity reverse-engineered from a live Playwright scrape of a
  reference studio storefront and cross-checked against a Google Stitch design system.
- Three type voices: EB Garamond display, Lora reading serif, and a built-in
  monospace label stack (eyebrows, vendor, price, buttons, index numerals).
- Refreshed palette: warm cream `#FBF8F2`, cool charcoal `#2E3030`, taupe accent
  `#766356`, plus sand / highlight / success / sale constants.
- Product imagery moves to a 4:5 portrait ratio floating on a pale media ground.
- Slimmer header (64px), more generous section rhythm (140–180px), wider page (1540px).
- Three presets: Atelier (default), Studio, Maison.
- Passes Shopify Theme Check with 0 offenses; validated via the Shopify Dev MCP.
