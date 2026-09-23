/*
 * Featured product — variant switching for the featured-product section and the
 * quick-buy modal, which render the same buy box. The media itself belongs to
 * <product-media-gallery> (product.js); this file only tells it which media the
 * newly selected variant wants.
 * Deliberately NOT product.js for the rest: the price HTML is pre-rendered per variant
 * server-side (data-fp-variants), so switching is correct and instant with no fetch
 * (product.js's price fetch is keyed to the page URL's product, which a section-
 * picked product is not). The add-to-cart itself reuses <product-form> (cart.js).
 */
(function () {
  function parse(el) { if (!el) return []; try { return JSON.parse(el.textContent); } catch (e) { return []; } }

  function init(root) {
    var variants = parse(root.querySelector('[data-fp-variants]'));
    if (!variants.length) return;
    var idInput = root.querySelector('[data-fp-variant-id]');
    var addBtn = root.querySelector('[data-fp-add]');
    var addLabel = root.querySelector('[data-fp-add-label]');
    var priceTarget = root.querySelector('[data-fp-price]');
    var gallery = root.querySelector('[data-product-media]');
    var dynamicCheckout = root.querySelector('[data-fp-dynamic-checkout]');
    /* Quick buy only: "View full product details" follows the selected variant. */
    var details = root.querySelector('[data-quick-buy-details]');

    function selectedOptions() {
      return Array.prototype.map.call(root.querySelectorAll('[data-fp-option-group]'), function (g) {
        var checked = g.querySelector('input:checked');
        return checked ? checked.value : null;
      });
    }

    /* Was setMainImage(src), which swapped one <img>'s src and so could only
       ever show an image: a variant whose media is a video or a 3D model left
       the previous photo on screen. The gallery is snippets/product-media now,
       the same one the product page uses, and it switches by media id across
       all four types — keeping the thumbnails, the AR button and playback in
       step, which a src swap could not do. */
    function setActiveMedia(id) {
      if (!gallery || id === null || id === undefined) return;
      if (typeof gallery.setActiveMedia === 'function') {
        gallery.setActiveMedia(id);
        return;
      }
      /* product.js is deferred and the modal injects this markup, so the
         element may not have upgraded yet. Same toggle it would have done. */
      var target = String(id);
      Array.prototype.forEach.call(gallery.querySelectorAll('[data-media-id]'), function (item) {
        item.classList.toggle('is-active', item.getAttribute('data-media-id') === target);
      });
      Array.prototype.forEach.call(gallery.querySelectorAll('[data-media-thumb]'), function (t) {
        var on = t.getAttribute('data-media-thumb') === target;
        t.classList.toggle('is-active', on);
        if (on) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
    }

    function updateVariant() {
      var opts = selectedOptions();
      var variant = variants.filter(function (v) {
        return v.options.length === opts.length && v.options.every(function (o, i) { return o === opts[i]; });
      })[0];

      root.querySelectorAll('[data-fp-option-group]').forEach(function (g) {
        var checked = g.querySelector('input:checked');
        var label = g.querySelector('[data-fp-option-selected]');
        if (checked && label) label.textContent = checked.value;
      });

      var available = Boolean(variant && variant.available);
      if (addBtn) {
        addBtn.disabled = !available;
        if (addLabel) addLabel.textContent = available ? addBtn.dataset.addText : addBtn.dataset.soldText;
      }
      /* Reconcile the hidden id on every change, including the no-match case.
         Guarding the whole block on `variant` left the previously selected id
         submittable and enabled while the button already read "Sold out". */
      if (idInput) {
        if (variant) idInput.value = variant.id;
        if (available) idInput.removeAttribute('disabled');
        else idInput.setAttribute('disabled', '');
      }
      /* The dynamic checkout button is only gated on product-level availability
         server-side, so it has to follow the selected variant here. */
      if (dynamicCheckout) dynamicCheckout.hidden = !available;
      if (variant && priceTarget && variant.price_html) priceTarget.innerHTML = variant.price_html;
      if (variant && details && variant.url) details.href = variant.url;
      if (variant && variant.media_id) setActiveMedia(variant.media_id);
    }

    root.addEventListener('change', function (e) {
      if (e.target.closest('[data-fp-option-group]')) updateVariant();
    });

    /* No thumbnail handler here any more: <product-media-gallery> binds its own
       and is the single owner of which media is active. */
  }

  function boot(scope) {
    (scope || document).querySelectorAll('[data-featured-product]').forEach(function (el) {
      /* Guard against double-binding: boot() can run again for a single section
         when the theme editor re-renders it. */
      if (el.dataset.fpBound === 'true') return;
      el.dataset.fpBound = 'true';
      init(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); });
  else boot();

  /* The script tag lives in theme.liquid, not in the section, so it is not
     re-executed when Shopify re-renders the section. Without this a merchant
     adding or editing a Featured product in the customizer got dead variant
     pills and dead thumbnails until a full page reload. */
  document.addEventListener('shopify:section:load', function (e) { boot(e.target); });
  /* The quick-buy modal injects the same buy box after fetching it. */
  document.addEventListener('quick-buy:loaded', function (e) { if (e.detail && e.detail.root) boot(e.detail.root.parentNode || e.detail.root); });
})();
