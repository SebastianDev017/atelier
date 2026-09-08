/*
 * Featured product — variant switching + thumbnail swap for the featured-product
 * section. Deliberately NOT product.js: the price HTML is pre-rendered per variant
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
    var mainImg = root.querySelector('[data-fp-main-img]');
    var dynamicCheckout = root.querySelector('[data-fp-dynamic-checkout]');

    function selectedOptions() {
      return Array.prototype.map.call(root.querySelectorAll('[data-fp-option-group]'), function (g) {
        var checked = g.querySelector('input:checked');
        return checked ? checked.value : null;
      });
    }

    function setMainImage(src) {
      if (mainImg && mainImg.tagName === 'IMG') {
        mainImg.removeAttribute('srcset');
        mainImg.src = src;
      }
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
      if (variant && variant.image) {
        setMainImage(variant.image);
        root.querySelectorAll('[data-fp-thumb]').forEach(function (t) { t.classList.remove('is-active'); });
      }
    }

    root.addEventListener('change', function (e) {
      if (e.target.closest('[data-fp-option-group]')) updateVariant();
    });

    root.querySelectorAll('[data-fp-thumb]').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        setMainImage(thumb.getAttribute('data-fp-thumb'));
        root.querySelectorAll('[data-fp-thumb]').forEach(function (t) { t.classList.toggle('is-active', t === thumb); });
      });
    });
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
})();
