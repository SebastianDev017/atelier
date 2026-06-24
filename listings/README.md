# /listings — Theme Store submission metadata

This folder holds the metadata used to submit **Atelier** to the Shopify Theme Store.

- `listing.json` — store listing: name, tagline, description, categories, feature list, and the three styles.
- `presets.json` — the design tokens behind each named preset (mirrors `config/settings_data.json`).
- `release-notes.md` — version history shown to merchants on update.
- `previews/` — reference renders of each style (replace with final 1600-wide marketing screenshots before submission).

The styles map 1:1 to the presets in `config/settings_data.json`: **Atelier** (default),
**Studio**, and **Maison**. The full visual contract lives in `../DESIGN.md` and `../TOKENS.md`;
a rendered, self-contained homepage reference is in `../preview.html`.
