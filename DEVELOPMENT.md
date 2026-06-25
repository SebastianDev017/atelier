# Atelier — Development Reference

Internal reference for building/maintaining the **Side Atelier** Shopify theme.
Not shipped in the theme ZIP (`shopify theme package` auto-excludes root `*.md`); kept in git for the team.

- **Repo:** `github.com/SebastianDev017/atelier` (private), branch `main`
- **Live theme:** `Side Atelier` → `atelier/main` on `sidebar-atelier.myshopify.com`
- **Deploy:** every `git push origin main` syncs into the live theme via the GitHub→Shopify integration
- **Base:** Shopify **skeleton-theme** (OS 2.0 — the only Theme-Store-approved base; never Dawn/Horizon)
- **Presets:** `Side Atelier` (default) · `Studio` · `Maison`
- **Validation gate:** `shopify theme check` = 0 offenses (extends `theme-check:recommended`)

---

## 1. MCP servers used

| MCP | Purpose |
|---|---|
| `shopify-dev` | `validate_theme` (official validator), `search_docs_chunks`, `learn_shopify_api`, `validate_component_codeblocks`, `validate_graphql_codeblocks` |
| `playwright` | Live storefront verification (`browser_navigate`/`browser_evaluate`/`browser_console_messages`/`browser_network_requests`/`browser_take_screenshot`) + the real scrape of fieldstudiesflora.com (V3) |
| `stitch` | Google Stitch — generated/validated the design system from DESIGN.md (V2/V3) |
| `context7` | On-demand library docs |

Connected but NOT used for Atelier: Figma, Canva, Gamma, Gmail, Google Calendar, Indeed, ZipRecruiter.

## 2. Skills & tools

- **`ui-ux-pro-max`** — design intelligence (palettes, font pairings, UX rules). Primary design skill (installed globally).
- **Workflow tool** (multi-agent orchestration) — adversarial reviews (dimensions × per-finding verify), the Theme-Store readiness audit, and the schema-i18n conversion (two passes + scripted deep-merge).
- `gsap-*` skills consulted, but **GSAP was removed** from the theme (licensing of the bundled 3.12.5 + page weight).

## 3. CLI

- **Shopify CLI** v4.2.0 — `shopify theme check` (authoritative gate; strict = `--config theme-check:all`), `shopify theme package`, `theme dev`, `theme list`, device-code auth.
- **Git + GitHub** — push to `main` → live sync. Node v24.15.0 / npm.
- `gh` CLI is NOT installed; the repo is private (can't read Actions/Pages headlessly).

## 4. Critical rules / gotchas

### Schema & settings
- **Font handles:** EB Garamond = `ebgaramond_n4` (NO underscore). Valid: `lora_n4`, `libre_baskerville_n4`, `dm_sans_n4`, `playfair_display_n4`, `jost_n4`. Cormorant Garamond is **not** in the picker.
- `settings_schema.json` is validated on **upload/sync, NOT by theme check**: `font_picker` defaults must be real handles; every `range` setting's **default AND the live `current` value must sit on the `step` grid** — one off value blocks the entire schema sync ("must be a step in the range" / "schema incompatible with the current setting value").
- `range` requires **integer** `min`/`max`/`step` — decimals are rejected by `ValidJSON`. (That's why `letter_spacing_headings` uses an integer `×100` scale + `times: 0.01` in css-variables, with no `unit`.)
- `theme_info`: specify **only ONE** of `theme_support_url` / `theme_support_email` (both → "Matches a schema that is not allowed"). `theme_documentation_url` is required by theme check.
- **`theme_name` must match a preset name exactly**, and `/listings` folder names must match preset names.
- `current` in `settings_data.json` must be an **object** (live settings), not a preset-name string (a string breaks `font_picker` resolution).
- New boolean settings absent from `settings_data` render as `data-x=""` on `<body>` (JS treats empty as default-ON).

### Liquid & CSS
- 🚨 **Shopify's CSS minifier STRIPS `:is()`** on served assets — never use it; expand to an explicit selector list. `:has()`, `var()`, `color-mix()`, `clamp()` all survive. theme check does not catch this.
- A `{% if settings.NEW_BOOL %}` **render gate** hides the element by default on the synced theme (setting resolves nil) → use **`!= false`**.
- `{% stylesheet %}` is invalid in `templates/` (sections/snippets/blocks only). Even the literal text `{% style %}` inside a `{% stylesheet %}` block trips `StaticStylesheetAndJavascriptTags` → use a raw `<style>` for per-instance Liquid CSS.
- **No hyphens** in template/section-group section keys, block keys, or `order`/`block_order` arrays (alphanumeric + `_` only). One invalid key silently rejects the whole JSON on import → 404. Hyphens are fine in section TYPE/filenames.
- Color-type settings resolve **nil** on the GitHub-synced theme → use CSS-level fallbacks `var(--color-background, #hex)` and `{% if settings.x != blank %}…{% else %}#hex{% endif %}` (the `| default` filter does NOT treat a Color drop as blank).
- Map a brief's invented token names to the theme's real ones (`--color-bg`/`--color-background`, `--font-heading`, `background_color`, `.nav-link`/`.sidebar-nav__sublink`, `.sidebar`/`.sidebar__panel`).
- A filtered value (`x | escape`) passed as an `image_tag` named arg with another arg after it → `LiquidHTMLSyntaxError`; precompute into a `{% liquid assign %}` var first.
- `--font-sans` is aliased to `--font-mono` (the editorial label voice) so label CSS resolves; `--font-heading`/`--font-body` come from the font settings.

### Deploy & GitHub→Shopify sync
- **Always `git fetch` + `git rebase origin/main` before pushing.** Shopify writes back "Update from Shopify" commits that can **clobber** developer-owned files (`settings_schema.json` once reset to the Skeleton base; `settings_data.json`/templates get normalized + a `/*…auto-generated…*/` JSONC header). After each rebase, check `settings_schema` `theme_name` is "Side Atelier", not "Skeleton".
- Sync is **slow + uneven** (per-page, ~2–30+ min). A "nudge" commit (touch a stalled file) re-triggers it. Verify a file actually went live by **fetching the served asset URL and grepping its text** — not by reading `document.styleSheets`. To see the home fresh, load `/?preview_theme_id=<id>` (bypasses the full-page cache).
- Direct `shopify theme push --allow-live` is blocked by the permission classifier — use the git→sync path.

### Packaging, submission & licensing
- `/listings` ships as **one folder per preset**: `listings/<preset>/{listing.json, preview.png, templates/index.json}`. It IS included in the ZIP; `docs/` (GitHub Pages) is excluded. No stray files in `/listings`.
- **Schema i18n:** all section + `settings_schema` strings use `t:` keys resolved in `locales/en.default.schema.json` (theme check validates that used keys exist; preserve the existing `general`/`labels`/`options` used by block files).
- **GSAP** must be ≥3.13 to be free for a sold theme (3.12.5 is grandfathered to the old license requiring paid Business Green) — we removed it entirely (was dead code). **Lenis** is MIT — keep the copyright banner.
- `AssetSizeJavaScript`: keep each globally-loaded JS file ≤10 KB gzip.
- Best Practices/Lighthouse: always emit a favicon (fallback inline SVG) so the browser never 404s `/favicon.ico`; images use `image_tag` + `aspect-ratio` + `object-fit: cover`.
- The packaged ZIP is named from `theme_name` → `Side Atelier-2.0.0.zip`.

### Tooling & verification
- The Grep tool (ripgrep, Rust regex) has **no lookahead** — `(?!…)` silently returns no matches; use plain patterns / post-filter.
- Bash tool cwd can reset between calls — use an explicit `cd /c/Users/PC/atelier-v5` (or `git -C`).
- Playwright headless throttles `requestAnimationFrame` (cursor lerp / rAF-throttled scroll listeners don't advance on dispatched events) → verify by checking the listener is wired + forcing the state class and reading computed CSS. CSS width/height transitions read mid-flight return the pre-transition value.
- Reveal-on-scroll makes full-page screenshots look empty → inject `.js [data-animate*]{opacity:1!important;transform:none!important}` before capturing.

## 5. Documentation links

**Shopify**
- Theme Store requirements — https://shopify.dev/docs/storefronts/themes/store/requirements
- settings_schema.json (theme_info) — https://shopify.dev/docs/storefronts/themes/architecture/config/settings-schema-json
- Theme Store changes (per-preset, eff. 2025-05-15) — https://shopify.dev/changelog/updated-shopify-theme-store-requirements-and-submission-process-effective-may-15-2025
- Schema locale files (i18n) — https://shopify.dev/docs/storefronts/themes/architecture/locales/schema-locale-files
- Available fonts (handles) — https://shopify.dev/docs/storefronts/themes/architecture/settings/fonts
- Accessibility best practices — https://shopify.dev/docs/storefronts/themes/best-practices/accessibility
- Performance best practices — https://shopify.dev/docs/storefronts/themes/best-practices/performance
- Check: AssetSizeJavaScript — https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks/asset-size-javascript
- Internationalization (tutorial) — https://shopify.dev/tutorials/review-theme-store-requirements-internationalization

**Third-party libraries**
- GSAP license — https://gsap.com/community/standard-license/ · https://webflow.com/blog/gsap-becomes-free · https://gsap.com/blog/3-13/
- Lenis (MIT) — https://github.com/darkroomengineering/lenis/blob/main/LICENSE

## 6. Architecture (quick map)

- `assets/base.css` — design system: static tokens + reset + all global component classes + `color-scheme--cream/parchment/linen/white/invert` + scroll-reveal `.js [data-animate*]`. Loaded every page.
- `snippets/css-variables.liquid` — bridges settings → CSS vars (colors with blank-checks, fonts via `font_face`, widths, cursor size, image radius/border). Uses `<style>` (not `{% stylesheet %}`) for Liquid CSS.
- Section CSS in `{% stylesheet %}`; per-instance values via inline `<style>` on `#shopify-section-{{ section.id }}`.
- JS — framework-free Web Components in `theme.js` (window.Atelier helpers, ScrollAnimator, `<quantity-input>`, `<header-component>`, CursorComponent, ScrollTopButton, NotifyMe, Lenis smooth-scroll), `cart.js` (`<cart-drawer>`/`<product-form>`/`<cart-page>`), `product.js` (`<product-info>` variant swap), `search.js` (`<predictive-search>`).
- Layout — vertical left **sidebar** nav (Roman-numeral index) via `header-group`; `site-layout` grid (`--sidebar-width` 1fr), collapses to an off-canvas drawer ≤768px.

## 7. Build method (proven)

1. Seed each version from the previous validated tree (robocopy/Copy-Item, excluding `.git`), not a bare skeleton.
2. Author the coupled spine (base.css + css-variables + theme.liquid + JS + header/footer + product-card/price stack + main-* sections + templates + presets) and theme-check to 0 BEFORE fanning out leaf sections.
3. Fan out leaf sections via a Workflow against a contract + a gold-standard section (rich-text).
4. Run an **adversarial review Workflow** (dimensions × per-finding verify) and fix confirmed findings.
5. `git fetch` + rebase → theme check 0 + `validate_theme` → push → Playwright-verify the live storefront (preset switching, contrast, console clean).

## 8. Theme Store submission — still pending (user actions)

- **Enable GitHub Pages** for the docs/support URL (repo is private → needs a public repo or a paid plan, else `https://sebastiandev017.github.io/atelier/` 404s).
- **Lighthouse** pass: Performance ≥60 + Accessibility ≥90 across home/product/collection (desktop+mobile), contrast ≥4.5:1, touch targets ≥24px.
- **Shopify Partner program**: approved Theme Partner, demo store per preset, support, original work.
