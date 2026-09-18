/*
 * Colour-swatch preview for product cards and the recently-viewed panel.
 *
 * Markup contract (snippets/product-card.liquid, assets/recently-viewed.js):
 *   [data-swatch-root]                 the card / item
 *     img.product-card__primary-img    the image to swap (or [data-swatch-target])
 *     [data-swatch-group] > a          one link per colour, to that variant;
 *       data-swatch-image / -srcset    the variant's own image, when it has one
 *
 * Hover or keyboard focus on a swatch shows that colour's image on the card;
 * leaving the swatch row restores the product image. A colour without an
 * image of its own keeps the product image. Clicking is a plain link to the
 * variant, so it works with no script at all.
 *
 * Delegated from the document, so cards rendered later -- filtered collection
 * grids, recommendations, the recently-viewed panel -- work without re-binding.
 */
(function () {
  function rootOf(el) { return el.closest('[data-swatch-root]'); }
  function targetOf(root) { return root.querySelector('[data-swatch-target], .product-card__primary-img'); }
  function swatchFrom(e) { return e.target && e.target.closest ? e.target.closest('[data-swatch-group] a') : null; }
  function groupFrom(e) { return e.target && e.target.closest ? e.target.closest('[data-swatch-group]') : null; }

  function clearActive(root) {
    root.querySelectorAll('[data-swatch-group] a.is-active').forEach(function (a) { a.classList.remove('is-active'); });
  }

  function restore(root) {
    var img = targetOf(root);
    if (img && img.dataset.origSrc !== undefined) {
      img.setAttribute('src', img.dataset.origSrc);
      if (img.dataset.origSrcset) img.setAttribute('srcset', img.dataset.origSrcset);
      else img.removeAttribute('srcset');
    }
    root.classList.remove('is-swatch-preview');
    clearActive(root);
  }

  function preview(sw) {
    var root = rootOf(sw);
    if (!root) return;
    var img = targetOf(root);
    clearActive(root);
    sw.classList.add('is-active');
    if (!img || img.tagName !== 'IMG' || !sw.dataset.swatchImage) {
      /* No image for this colour: show the product image, keep the ring. */
      if (img && img.dataset.origSrc !== undefined) {
        img.setAttribute('src', img.dataset.origSrc);
        if (img.dataset.origSrcset) img.setAttribute('srcset', img.dataset.origSrcset);
        else img.removeAttribute('srcset');
      }
      root.classList.remove('is-swatch-preview');
      return;
    }
    if (img.dataset.origSrc === undefined) {
      img.dataset.origSrc = img.getAttribute('src') || '';
      img.dataset.origSrcset = img.getAttribute('srcset') || '';
    }
    if (sw.dataset.swatchSrcset) img.setAttribute('srcset', sw.dataset.swatchSrcset);
    else img.removeAttribute('srcset');
    img.setAttribute('src', sw.dataset.swatchImage);
    root.classList.add('is-swatch-preview');
  }

  /* Warm the cache the first time a pointer reaches a swatch row, so the swap
     does not flash an empty frame while the image downloads. */
  function preload(group) {
    if (group.dataset.swatchPreloaded) return;
    group.dataset.swatchPreloaded = 'true';
    group.querySelectorAll('a[data-swatch-image]').forEach(function (a) { var i = new Image(); i.src = a.dataset.swatchImage; });
  }

  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return; /* a tap is a navigation, not a preview */
    var group = groupFrom(e);
    if (group) preload(group);
    var sw = swatchFrom(e);
    if (sw) preview(sw);
  });
  document.addEventListener('pointerout', function (e) {
    var group = groupFrom(e);
    if (group && !group.contains(e.relatedTarget)) { var root = rootOf(group); if (root) restore(root); }
  });
  document.addEventListener('focusin', function (e) {
    var sw = swatchFrom(e);
    if (sw) preview(sw);
  });
  document.addEventListener('focusout', function (e) {
    var group = groupFrom(e);
    if (group && !group.contains(e.relatedTarget)) { var root = rootOf(group); if (root) restore(root); }
  });
})();
