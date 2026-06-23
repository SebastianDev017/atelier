/* ============================================================
   ATELIER — product.js
   Loaded by main-product and main-article.
   - <product-info>  : variant selection (client state + price swap)
   - <product-media-gallery> : thumbnail / variant media switching
   - <share-button>  : Web Share API with clipboard fallback
   - <product-recommendations> : lazy-loads related products
   ============================================================ */
(function () {
  'use strict';

  function isDesignMode() { return Boolean(window.Shopify && window.Shopify.designMode); }

  /* ---------- <product-info> ---------- */
  var ProductInfo = (function () {
    function ProductInfo() { return Reflect.construct(HTMLElement, [], ProductInfo); }
    ProductInfo.prototype = Object.create(HTMLElement.prototype);
    ProductInfo.prototype.constructor = ProductInfo;

    ProductInfo.prototype.connectedCallback = function () {
      this.sectionId = this.dataset.sectionId;
      this.productUrl = this.dataset.url;
      this.updateUrl = this.dataset.updateUrl === 'true';
      this.variants = this.parseVariants();
      this.picker = this.querySelector('[data-variant-picker]');
      this.idInputs = Array.prototype.slice.call(this.querySelectorAll('[data-variant-id]'));
      this.gallery = this.querySelector('[data-product-media]');
      this.sticky = this.querySelector('[data-product-sticky]');

      this.onChange = this.onChange.bind(this);
      if (this.picker) this.picker.addEventListener('change', this.onChange);
      this.initSticky();
    };

    ProductInfo.prototype.disconnectedCallback = function () {
      if (this.picker) this.picker.removeEventListener('change', this.onChange);
      if (this.stickyObserver) this.stickyObserver.disconnect();
    };

    ProductInfo.prototype.parseVariants = function () {
      var script = this.querySelector('[data-variant-json]');
      if (!script) return [];
      try { return JSON.parse(script.textContent); } catch (e) { return []; }
    };

    ProductInfo.prototype.selectedOptions = function () {
      return Array.prototype.map.call(this.querySelectorAll('.variant-option'), function (fs) {
        var checked = fs.querySelector('input:checked');
        return checked ? checked.value : null;
      });
    };

    ProductInfo.prototype.getVariant = function (options) {
      return this.variants.filter(function (v) {
        return v.options.length === options.length && v.options.every(function (o, i) { return o === options[i]; });
      })[0];
    };

    ProductInfo.prototype.onChange = function () {
      var options = this.selectedOptions();
      var variant = this.getVariant(options);
      this.updateSelectedLabels();
      this.updateButtons(variant);

      if (!variant) return;
      this.currentVariant = variant;
      this.idInputs.forEach(function (input) {
        input.value = variant.id;
        input.removeAttribute('disabled');
      });
      if (this.gallery && variant.featured_media && typeof this.gallery.setActiveMedia === 'function') {
        this.gallery.setActiveMedia(variant.featured_media.id);
      }
      if (this.updateUrl && window.history.replaceState) {
        window.history.replaceState({}, '', this.productUrl + '?variant=' + variant.id);
      }
      this.renderPrice(variant.id);
    };

    ProductInfo.prototype.updateSelectedLabels = function () {
      Array.prototype.forEach.call(this.querySelectorAll('.variant-option'), function (fs) {
        var checked = fs.querySelector('input:checked');
        var label = fs.querySelector('[data-option-selected]');
        if (checked && label) label.textContent = checked.value;
      });
    };

    ProductInfo.prototype.updateButtons = function (variant) {
      var available = Boolean(variant && variant.available);
      var text = !variant
        ? this.dataset.unavailableText
        : available
          ? this.dataset.addText
          : this.dataset.soldOutText;
      Array.prototype.forEach.call(this.querySelectorAll('[data-add-button]'), function (btn) {
        btn.disabled = !available;
        var label = btn.querySelector('[data-add-label]');
        if (label) label.textContent = text;
      });
    };

    ProductInfo.prototype.renderPrice = function (variantId) {
      var self = this;
      var url = this.productUrl + '?variant=' + variantId + '&section_id=' + this.sectionId;
      fetch(url)
        .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
        .then(function (text) {
          var doc = new DOMParser().parseFromString(text, 'text/html');
          // Swap per-variant regions: price and low-stock inventory line.
          ['[data-price-target]', '[data-inventory-target]'].forEach(function (sel) {
            var incoming = doc.querySelectorAll(sel);
            var current = self.querySelectorAll(sel);
            Array.prototype.forEach.call(current, function (node, i) {
              if (incoming[i]) node.innerHTML = incoming[i].innerHTML;
            });
          });
        })
        .catch(function () { /* keep client-side values */ });
    };

    ProductInfo.prototype.initSticky = function () {
      if (!this.sticky || !('IntersectionObserver' in window)) return;
      var buyArea = this.querySelector('.product__buy-area') || this.querySelector('[data-buy-button]');
      if (!buyArea) return;
      var self = this;
      this.stickyObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            self.sticky.classList.toggle('is-visible', show);
          });
        },
        { threshold: 0 }
      );
      this.stickyObserver.observe(buyArea);
    };

    return ProductInfo;
  })();

  /* ---------- <product-media-gallery> ---------- */
  var ProductMediaGallery = (function () {
    function ProductMediaGallery() { return Reflect.construct(HTMLElement, [], ProductMediaGallery); }
    ProductMediaGallery.prototype = Object.create(HTMLElement.prototype);
    ProductMediaGallery.prototype.constructor = ProductMediaGallery;

    ProductMediaGallery.prototype.connectedCallback = function () {
      this.items = Array.prototype.slice.call(this.querySelectorAll('[data-media-id]'));
      this.thumbs = Array.prototype.slice.call(this.querySelectorAll('[data-media-thumb]'));
      this.onThumb = this.onThumb.bind(this);
      this.thumbs.forEach((t) => t.addEventListener('click', this.onThumb));
    };
    ProductMediaGallery.prototype.disconnectedCallback = function () {
      this.thumbs.forEach((t) => t.removeEventListener('click', this.onThumb));
    };
    ProductMediaGallery.prototype.onThumb = function (event) {
      this.setActiveMedia(event.currentTarget.getAttribute('data-media-thumb'));
    };
    ProductMediaGallery.prototype.setActiveMedia = function (id) {
      id = String(id);
      this.items.forEach(function (item) {
        item.classList.toggle('is-active', item.getAttribute('data-media-id') === id);
      });
      this.thumbs.forEach(function (t) {
        var active = t.getAttribute('data-media-thumb') === id;
        t.classList.toggle('is-active', active);
        if (active) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
      this.querySelectorAll('video').forEach(function (v) {
        if (!v.closest('.is-active')) v.pause();
      });
    };
    return ProductMediaGallery;
  })();

  /* ---------- <share-button> ---------- */
  var ShareButton = (function () {
    function ShareButton() { return Reflect.construct(HTMLElement, [], ShareButton); }
    ShareButton.prototype = Object.create(HTMLElement.prototype);
    ShareButton.prototype.constructor = ShareButton;

    ShareButton.prototype.connectedCallback = function () {
      this.url = this.dataset.shareUrl || window.location.href;
      this.trigger = this.querySelector('[data-share-trigger]');
      this.copied = this.querySelector('[data-share-copied]');
      this.onClick = this.onClick.bind(this);
      if (this.trigger) this.trigger.addEventListener('click', this.onClick);
    };
    ShareButton.prototype.disconnectedCallback = function () {
      if (this.trigger) this.trigger.removeEventListener('click', this.onClick);
      clearTimeout(this.timer);
    };
    ShareButton.prototype.onClick = function () {
      var self = this;
      if (navigator.share) {
        navigator.share({ url: this.url, title: document.title }).catch(function () {});
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.url).then(function () { self.showCopied(); }).catch(function () {});
      }
    };
    ShareButton.prototype.showCopied = function () {
      if (!this.copied) return;
      var self = this;
      this.copied.hidden = false;
      clearTimeout(this.timer);
      this.timer = setTimeout(function () { self.copied.hidden = true; }, 2500);
    };
    return ShareButton;
  })();

  /* ---------- <product-recommendations> ---------- */
  var ProductRecommendations = (function () {
    function ProductRecommendations() { return Reflect.construct(HTMLElement, [], ProductRecommendations); }
    ProductRecommendations.prototype = Object.create(HTMLElement.prototype);
    ProductRecommendations.prototype.constructor = ProductRecommendations;

    ProductRecommendations.prototype.connectedCallback = function () {
      var url = this.dataset.url;
      if (!url || this.dataset.loaded === 'true') return;
      var self = this;

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            self.observer.disconnect();
            self.load(url);
          }
        }, { rootMargin: '0px 0px 400px 0px' });
        this.observer.observe(this);
      } else {
        this.load(url);
      }
    };
    ProductRecommendations.prototype.disconnectedCallback = function () {
      if (this.observer) this.observer.disconnect();
    };
    ProductRecommendations.prototype.load = function (url) {
      var self = this;
      fetch(url)
        .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
        .then(function (text) {
          var doc = new DOMParser().parseFromString(text, 'text/html');
          var incoming = doc.querySelector('product-recommendations');
          if (incoming && incoming.innerHTML.trim().length) {
            self.innerHTML = incoming.innerHTML;
            self.dataset.loaded = 'true';
          } else {
            self.hidden = true;
          }
        })
        .catch(function () { self.hidden = true; });
    };
    return ProductRecommendations;
  })();

  function define(name, ctor) {
    if (!customElements.get(name)) customElements.define(name, ctor);
  }
  define('product-info', ProductInfo);
  define('product-media-gallery', ProductMediaGallery);
  define('share-button', ShareButton);
  define('product-recommendations', ProductRecommendations);
})();
