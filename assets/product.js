/* ============================================================
   ATELIER — product.js
   Loaded globally from layout/theme.liquid: <product-media-gallery> is not
   product-page-only any more — the featured-product section puts one on the
   homepage and the quick-buy modal injects one anywhere.
   - <product-info>  : variant selection (client state + price swap)
   - <product-media-gallery> : thumbnail / variant media switching, all four
                       media types, and the Shopify-XR / model-viewer wiring
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

      /* Reconcile the hidden id BEFORE the early return. Bailing out first left
         the previously selected variant's id submittable and its price on screen
         while the button already read "Unavailable". */
      this.idInputs.forEach(function (input) {
        if (variant) input.value = variant.id;
        /* A variant that exists but is out of stock must stay disabled. This used
           to call removeAttribute unconditionally, silently re-enabling it. */
        if (variant && variant.available) input.removeAttribute('disabled');
        else input.setAttribute('disabled', '');
      });

      /* QW2 -- the back-in-stock form follows the SELECTED variant: shown for a
         sold-out one (even while others are in stock), hidden otherwise, and the
         request it sends names that exact variant. */
      var notifyWrap = this.querySelector('[data-notify-wrap]');
      if (notifyWrap) notifyWrap.hidden = !(variant && !variant.available);
      var notifyBody = this.querySelector('[data-notify-body]');
      if (notifyBody && variant) {
        notifyBody.value = 'Back-in-stock request for: ' + notifyBody.dataset.productTitle +
          (variant.title && variant.title !== 'Default Title' ? ' — ' + variant.title : '') +
          ' — ' + notifyBody.dataset.productUrl + '?variant=' + variant.id;
      }

      if (!variant) return;
      this.currentVariant = variant;
      if (this.gallery && variant.featured_media && typeof this.gallery.setActiveMedia === 'function') {
        this.gallery.setActiveMedia(variant.featured_media.id);
      }
      if (this.updateUrl && window.history.replaceState) {
        window.history.replaceState({}, '', this.productUrl + '?variant=' + variant.id);
      }
      this.renderPrice(variant.id);
      /* Broadcast the selection so independent components (local pickup) can
         react without product.js needing to know they exist. */
      document.dispatchEvent(new CustomEvent('atelier:variant:change', {
        detail: { variant: variant, sectionId: this.sectionId }
      }));
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
      /* Monotonic request id: clicking through options fires one fetch each, and
         without this the price settled on whichever response happened to land
         last rather than the one most recently asked for. */
      var reqId = (this._priceRequestId || 0) + 1;
      this._priceRequestId = reqId;
      var url = this.productUrl + '?variant=' + variantId + '&section_id=' + this.sectionId;
      fetch(url)
        .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
        .then(function (text) {
          if (reqId !== self._priceRequestId) return; // superseded
          var doc = new DOMParser().parseFromString(text, 'text/html');
          // Swap per-variant regions: price and low-stock inventory line.
          /* [data-payment-terms] added in B3: the installments banner is priced per
             variant, and it was the one variant-dependent block left out of this
             swap -- after a switch it kept quoting the first variant. */
          ['[data-price-target]', '[data-inventory-target]', '[data-payment-terms]'].forEach(function (sel) {
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
      /* Watch the Add to cart button's own wrapper, not the whole buy area: the
         quantity row above it peeking into view counted as "in view" and kept the
         bar hidden while the button itself was still below the fold. */
      var buyArea = this.querySelector('[data-buy-button]') || this.querySelector('.product__buy-area');
      if (!buyArea) return;
      var self = this;
      this.stickyObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            /* CRIT2 -- shown whenever the real Add to cart is not FULLY on screen,
               below the viewport as well as above it. It used to wait until the buy
               area had scrolled past (top < 0), so on a phone -- where Add to cart
               starts below the fold -- the first ~600px of scrolling had no way to
               buy at all. It hides while the real button is wholly in view, so the
               two are never both on screen. */
            var show = entry.intersectionRatio < 1;
            self.sticky.classList.toggle('is-visible', show);
          });
        },
        { threshold: [0, 1] }
      );
      this.stickyObserver.observe(buyArea);
    };

    return ProductInfo;
  })();

  /* ---------- 3D models: Shopify-XR + model-viewer ---------- */
  /* model_viewer_tag emits <model-viewer>, an element nothing in the theme ever
     defined. Measured on the live stores before this was written:
     customElements.get('model-viewer') was false, so a 3D model rendered as an
     empty box on the product page too — not only on the two surfaces that were
     missing rich media entirely. Shopify serves the viewer UI and the AR
     launcher through loadFeatures; both are requested the first time a gallery
     that actually holds a model connects, so a store with no 3D pays nothing. */
  var MODEL_VIEWER_CSS = 'https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css';

  var ProductModels = {
    queued: [],     /* models waiting for ShopifyXR.addModels */
    galleries: [],  /* galleries waiting for Shopify.ModelViewerUI */
    asked: false,

    register: function (gallery) {
      var source = gallery.querySelector('[data-product-models]');
      if (!source) return;
      var models;
      try { models = JSON.parse(source.textContent); } catch (e) { return; }
      if (!models || !models.length) return;
      this.queued = this.queued.concat(models);
      this.galleries.push(gallery);
      this.load();
    },

    load: function () {
      var self = this;
      if (!window.Shopify || typeof window.Shopify.loadFeatures !== 'function') return;
      /* A second gallery (the quick-buy modal, say) arriving after the features
         are already in flight or done: no second request, just re-run both
         steps against what is now in the DOM. */
      if (this.asked) { this.wireXR(); this.enhance(); return; }
      this.asked = true;
      this.styles();
      window.Shopify.loadFeatures([
        { name: 'shopify-xr', version: '1.0', onLoad: function (errors) { if (!errors) self.wireXR(); } },
        { name: 'model-viewer-ui', version: '1.0', onLoad: function (errors) { if (!errors) self.enhance(); } }
      ]);
    },

    styles: function () {
      if (document.getElementById('ModelViewerStyle')) return;
      var link = document.createElement('link');
      link.id = 'ModelViewerStyle';
      link.rel = 'stylesheet';
      link.href = MODEL_VIEWER_CSS;
      document.head.appendChild(link);
    },

    /* Shopify's documented guard, and it is load-bearing: window.ShopifyXR is
       still undefined at the moment loadFeatures reports the script loaded. */
    wireXR: function () {
      var self = this;
      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function () { self.wireXR(); }, { once: true });
        return;
      }
      if (this.queued.length) {
        window.ShopifyXR.addModels(this.queued);
        this.queued = [];
      }
      /* Scans for [data-shopify-xr] and unhides the buttons it can serve. */
      window.ShopifyXR.setupXRElements();
    },

    enhance: function () {
      if (typeof (window.Shopify || {}).ModelViewerUI !== 'function') return;
      this.galleries.forEach(function (gallery) {
        Array.prototype.forEach.call(gallery.querySelectorAll('model-viewer'), function (viewer) {
          if (viewer.dataset.viewerBound === 'true') return;
          viewer.dataset.viewerBound = 'true';
          try { new window.Shopify.ModelViewerUI(viewer); }
          catch (e) { delete viewer.dataset.viewerBound; }
        });
      });
      /* The modal's gallery is thrown away each time it closes; don't hold it. */
      this.galleries = this.galleries.filter(function (g) { return g.isConnected; });
    }
  };

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
      ProductModels.register(this);
      /* Run once on connect, not only on a switch: it is what keeps the
         embeds of media nobody has opened from loading in the first place. */
      this.syncPlayback();
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
      this.syncPlayback();
    };
    /* Only the media on screen may be playing — Shopify's own requirement for
       a multi-media gallery. A native <video> just pauses. An external video is
       a YouTube or Vimeo iframe with no API reachable without opting every
       embed into enablejsapi, so its src is parked in a data attribute while it
       is off screen and restored when it comes back: playback stops for
       certain, and an embed nobody has opened is never fetched at all. */
    ProductMediaGallery.prototype.syncPlayback = function () {
      this.items.forEach(function (item) {
        var active = item.classList.contains('is-active');
        Array.prototype.forEach.call(item.querySelectorAll('video'), function (v) {
          if (!active) v.pause();
        });
        Array.prototype.forEach.call(item.querySelectorAll('iframe'), function (frame) {
          if (active) {
            if (frame.dataset.parkedSrc) {
              frame.setAttribute('src', frame.dataset.parkedSrc);
              delete frame.dataset.parkedSrc;
            }
          } else if (frame.getAttribute('src')) {
            frame.dataset.parkedSrc = frame.getAttribute('src');
            frame.removeAttribute('src');
          }
        });
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
