# Release notes

## 4.1.0

New sections

- **Collection showcase**: a list of collections where the name you point at decides the picture; the image comes from the block, the collection, or its most recent product.
- **Spec compare** (Contour): the same measurements for up to four products in one table, scrollable on a phone.
- **FAQ ledger**: questions that open in place, with the first one open by default.
- **Finish gallery** (Contour product page): every colour or finish of a product as a row of its own variant photographs.
- **Wall comparison** (Annex): a before-and-after wall with a drag handle.
- **Frame preview** (Annex): a print drawn inside each frame finish and mat depth.
- **Overlap index** (Annex): artwork names set large enough to overlap, the one you point at lifted out with its picture.
- **Glaze library** and **Kiln log** (Maison): the studio palette as named specimens, and a dated log of firings.
- **Video**: a YouTube, Vimeo or hosted video with the platform's own controls; nothing loads until someone presses play.

Product page

- Rich product media (hosted video, YouTube, Vimeo and 3D models) in the product template, the featured product section and quick view; the 3D viewer loads only when a model is opened and the AR button no longer shifts the layout.
- Pickup availability is decided at render, so the product information never jumps.
- Buy it now is hidden while the selected variant is sold out.
- Uppercase headings are a display-level decision, and step markers on the process timeline can be aligned by the merchant.

Performance and accessibility

- Images decode off the main thread; the hero and the pinned rail warm their images before they arrive.
- No infinite animation loops: the scroll cue and the press marquee are CSS.
- Touch targets meet 24 x 24 px on every page; a contrast miss in the spec table and a sideways overflow on a 25-section home page were fixed.

Settings and install

- Setting labels follow the Theme Store style guide (subject stated once, active voice, no ampersands), in all five languages.
- Preset install templates mirror their demo stores, without demo imagery.
- The theme carries its own licence with third-party attribution (GSAP, Lenis, QRCode.js).

## 4.0.0

- Three presets: Contour, Annex and Maison, each with its own demo store.
- Quick buy, clickable colour swatches and colour filters on collection pages.
- Retractable sidebar navigation, free-shipping progress, colour scheme groups.
