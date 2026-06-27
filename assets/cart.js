/* ============================================================
   ATELIER — cart.js
   Loaded on every page (defer).
   - <cart-drawer>  : slide-out drawer + Section Rendering swaps
   - <product-form> : AJAX add to cart (falls back to native submit
                      when no drawer is present)
   - <cart-page>    : AJAX quantity / remove on the cart page
   ============================================================ */
(function () {
  'use strict';

  var A = window.Atelier || {};

  function cartRoute(path) {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    if (root.charAt(root.length - 1) !== '/') root += '/';
    return root + path;
  }

  function updateCartCount(count, text) {
    var n = parseInt(count, 10);
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.classList.toggle('is-empty', !n);
    });
    if (text != null) {
      document.querySelectorAll('[data-cart-count-text]').forEach(function (el) {
        el.textContent = text;
      });
    }
  }

  function postChange(payload) {
    return fetch(cartRoute('cart/change.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.json(); });
  }

  /* ---------- <cart-drawer> ---------- */
  var CartDrawer = (function () {
    function CartDrawer() { return Reflect.construct(HTMLElement, [], CartDrawer); }
    CartDrawer.prototype = Object.create(HTMLElement.prototype);
    CartDrawer.prototype.constructor = CartDrawer;

    CartDrawer.prototype.connectedCallback = function () {
      this.overlay = this.querySelector('[data-drawer-overlay]');
      this.onClick = this.onClick.bind(this);
      this.onChange = this.onChange.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.onToggle = this.onToggle.bind(this);
      this.onNote = A.debounce(this.saveNote.bind(this), 600);

      this.addEventListener('click', this.onClick);
      this.addEventListener('change', this.onChange);
      this.addEventListener('input', this.onNote);
      document.addEventListener('keydown', this.onKeydown);
      document.addEventListener('click', this.onToggle);
    };

    CartDrawer.prototype.disconnectedCallback = function () {
      document.removeEventListener('keydown', this.onKeydown);
      document.removeEventListener('click', this.onToggle);
    };

    CartDrawer.prototype.onToggle = function (event) {
      var trigger = event.target.closest('[data-cart-toggle]');
      if (!trigger) return;
      event.preventDefault();
      this.activeTrigger = trigger;
      this.open(trigger);
    };

    CartDrawer.prototype.onKeydown = function (event) {
      if (event.key === 'Escape' && this.classList.contains('is-open')) this.close();
    };

    CartDrawer.prototype.onClick = function (event) {
      if (event.target.closest('[data-drawer-close]') || event.target === this.overlay) {
        event.preventDefault();
        this.close();
        return;
      }
      var remove = event.target.closest('[data-remove-line]');
      if (remove) {
        event.preventDefault();
        var item = remove.closest('[data-cart-item]');
        if (item) this.updateLine(item.dataset.line, 0);
      }
    };

    CartDrawer.prototype.onChange = function (event) {
      var input = event.target.closest('[data-quantity-line]');
      if (!input) return;
      var item = input.closest('[data-cart-item]');
      if (item) this.updateLine(item.dataset.line, parseInt(input.value, 10));
    };

    CartDrawer.prototype.saveNote = function (event) {
      var note = event.target.closest('[data-cart-note]');
      if (!note) return;
      fetch(cartRoute('cart/update.js'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ note: note.value })
      }).catch(function () {});
    };

    CartDrawer.prototype.open = function (trigger) {
      if (trigger) this.activeTrigger = trigger;
      this.classList.add('is-open');
      this.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('no-scroll');
      document.body.style.overflow = 'hidden';
      /* Freeze Lenis too — without this it keeps driving page scroll behind the
         drawer, so wheel/touch over the drawer bleeds through to the page. */
      if (window.lenis) window.lenis.stop();
      var focusTarget = this.querySelector('[data-drawer-close]');
      if (A.trapFocus) A.trapFocus(this.querySelector('.cart-drawer__panel'), focusTarget);
      this.animateItems();
    };

    /* GSAP line-item stagger on open — additive polish over the CSS panel slide,
       so it degrades gracefully without GSAP and under prefers-reduced-motion. */
    CartDrawer.prototype.animateItems = function () {
      if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var items = this.querySelectorAll('[data-cart-item]');
      if (items.length) gsap.from(items, { opacity: 0, y: 14, duration: 0.45, ease: 'power2.out', stagger: 0.06, delay: 0.1 });
    };

    CartDrawer.prototype.close = function () {
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('no-scroll');
      document.body.style.overflow = '';
      if (window.lenis) window.lenis.start();
      if (A.removeTrapFocus) A.removeTrapFocus(this.activeTrigger);
    };

    CartDrawer.prototype.renderContents = function (sectionHTML) {
      var doc = new DOMParser().parseFromString(sectionHTML, 'text/html');
      var incoming = doc.querySelector('[data-cart-contents]');
      var current = this.querySelector('[data-cart-contents]');
      if (incoming && current) {
        current.replaceWith(incoming);
        updateCartCount(incoming.getAttribute('data-count'), incoming.getAttribute('data-count-text'));
      }
    };

    CartDrawer.prototype.updateLine = function (line, quantity) {
      var self = this;
      this.classList.add('is-loading');
      postChange({ line: Number(line), quantity: quantity, sections: ['cart-drawer'], sections_url: window.location.pathname })
        .then(function (cart) {
          if (cart && cart.sections && cart.sections['cart-drawer']) {
            self.renderContents(cart.sections['cart-drawer']);
          }
          if (cart) updateCartCount(cart.item_count);
        })
        .catch(function () {})
        .finally(function () { self.classList.remove('is-loading'); });
    };

    return CartDrawer;
  })();

  /* ---------- <product-form> ---------- */
  var ProductForm = (function () {
    function ProductForm() { return Reflect.construct(HTMLElement, [], ProductForm); }
    ProductForm.prototype = Object.create(HTMLElement.prototype);
    ProductForm.prototype.constructor = ProductForm;

    ProductForm.prototype.connectedCallback = function () {
      this.form = this.querySelector('form');
      this.error = this.querySelector('[data-form-error]');
      this.onSubmit = this.onSubmit.bind(this);
      if (this.form) this.form.addEventListener('submit', this.onSubmit);
    };
    ProductForm.prototype.disconnectedCallback = function () {
      if (this.form) this.form.removeEventListener('submit', this.onSubmit);
    };

    ProductForm.prototype.buttons = function () {
      var id = this.form ? this.form.id : null;
      var list = Array.prototype.slice.call(this.querySelectorAll('[data-add-button]'));
      if (id) {
        document.querySelectorAll('[data-add-button][form="' + id + '"]').forEach(function (b) {
          if (list.indexOf(b) === -1) list.push(b);
        });
      }
      return list;
    };

    ProductForm.prototype.onSubmit = function (event) {
      var drawer = document.querySelector('cart-drawer');
      if (!drawer) return; // no drawer: let the form submit natively to the cart
      event.preventDefault();
      if (this.loading) return;
      this.setLoading(true);
      this.clearError();

      var self = this;
      var formData = new FormData(this.form);
      formData.append('sections', 'cart-drawer');
      formData.append('sections_url', window.location.pathname);

      fetch(cartRoute('cart/add.js'), {
        method: 'POST',
        headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.status) {
            self.showError(data.description || data.message);
            return;
          }
          if (data.sections && data.sections['cart-drawer']) {
            drawer.renderContents(data.sections['cart-drawer']);
            drawer.open();
          }
        })
        .catch(function () { self.showError(''); })
        .finally(function () { self.setLoading(false); });
    };

    ProductForm.prototype.setLoading = function (state) {
      this.loading = state;
      this.buttons().forEach(function (btn) {
        btn.classList.toggle('is-loading', state);
        btn.setAttribute('aria-busy', String(state));
      });
    };

    ProductForm.prototype.showError = function (message) {
      if (!this.error) return;
      this.error.hidden = false;
      this.error.textContent = message || 'Something went wrong. Please try again.';
    };
    ProductForm.prototype.clearError = function () {
      if (!this.error) return;
      this.error.hidden = true;
      this.error.textContent = '';
    };

    return ProductForm;
  })();

  /* ---------- <cart-page> ---------- */
  var CartPage = (function () {
    function CartPage() { return Reflect.construct(HTMLElement, [], CartPage); }
    CartPage.prototype = Object.create(HTMLElement.prototype);
    CartPage.prototype.constructor = CartPage;

    CartPage.prototype.connectedCallback = function () {
      this.sectionId = this.dataset.sectionId;
      this.onClick = this.onClick.bind(this);
      this.onChange = this.onChange.bind(this);
      this.onNote = A.debounce(this.saveNote.bind(this), 600);
      this.addEventListener('click', this.onClick);
      this.addEventListener('change', this.onChange);
      this.addEventListener('input', this.onNote);
    };

    CartPage.prototype.onClick = function (event) {
      var remove = event.target.closest('[data-remove-line]');
      if (!remove) return;
      event.preventDefault();
      var item = remove.closest('[data-cart-item]');
      if (item) this.updateLine(item.dataset.line, 0);
    };

    CartPage.prototype.onChange = function (event) {
      var input = event.target.closest('[data-quantity-line]');
      if (!input) return;
      var item = input.closest('[data-cart-item]');
      if (item) this.updateLine(item.dataset.line, parseInt(input.value, 10));
    };

    CartPage.prototype.saveNote = function (event) {
      var note = event.target.closest('[data-cart-note]');
      if (!note) return;
      fetch(cartRoute('cart/update.js'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ note: note.value })
      }).catch(function () {});
    };

    CartPage.prototype.updateLine = function (line, quantity) {
      var self = this;
      this.classList.add('is-loading');
      postChange({ line: Number(line), quantity: quantity, sections: [this.sectionId], sections_url: window.location.pathname })
        .then(function (cart) {
          if (cart && cart.sections && cart.sections[self.sectionId]) {
            var doc = new DOMParser().parseFromString(cart.sections[self.sectionId], 'text/html');
            var incoming = doc.querySelector('[data-cart-page-contents]');
            var current = self.querySelector('[data-cart-page-contents]');
            if (incoming && current) current.innerHTML = incoming.innerHTML;
          }
          if (cart) updateCartCount(cart.item_count);
        })
        .catch(function () {})
        .finally(function () { self.classList.remove('is-loading'); });
    };

    return CartPage;
  })();

  /* ---------- Bundle / upsell quick-add ([data-bundle-add]) ----------
     One delegated handler shared by the featured-product bundle and the cart-drawer
     bundle strip. Adds a single variant via /cart/add.js with Section Rendering, so
     the drawer contents (count badge + the strip itself) re-render, then flashes a
     check on the button. Mirrors ProductForm's add path; no per-button binding. */
  function addBundleItem(btn) {
    if (btn.disabled || btn.classList.contains('is-adding')) return;
    var id = btn.getAttribute('data-variant-id');
    if (!id) return;
    btn.classList.add('is-adding');
    var drawer = document.querySelector('cart-drawer');
    var body = { id: Number(id), quantity: 1 };
    if (drawer) { body.sections = ['cart-drawer']; body.sections_url = window.location.pathname; }
    fetch(cartRoute('cart/add.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/javascript' },
      body: JSON.stringify(body)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status) return; // e.g. sold out — leave the button as-is
        if (drawer && data.sections && data.sections['cart-drawer']) {
          drawer.renderContents(data.sections['cart-drawer']);
        } else {
          fetch(cartRoute('cart.js')).then(function (r) { return r.json(); })
            .then(function (c) { updateCartCount(c.item_count); }).catch(function () {});
        }
        btn.classList.add('is-added');
        setTimeout(function () { btn.classList.remove('is-added'); }, 1500);
      })
      .catch(function () {})
      .finally(function () { btn.classList.remove('is-adding'); });
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-bundle-add]');
    if (!btn) return;
    event.preventDefault();
    addBundleItem(btn);
  });

  function define(name, ctor) {
    if (!customElements.get(name)) customElements.define(name, ctor);
  }
  define('cart-drawer', CartDrawer);
  define('product-form', ProductForm);
  define('cart-page', CartPage);
})();
