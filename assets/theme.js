/* ============================================================
   ATELIER — theme.js
   Framework-free core. Loaded on every page (defer).
   - window.Atelier helpers
   - ScrollAnimator (scroll reveal, re-observes on section load)
   - <quantity-input>, <header-component>, <facet-form>,
     <localization-dropdown>
   All animation / autoplay is disabled in Shopify.designMode and
   when prefers-reduced-motion is set. Every component removes its
   listeners in disconnectedCallback.
   ============================================================ */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function isDesignMode() { return Boolean(window.Shopify && window.Shopify.designMode); }

  var FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';

  var trapHandlers = {};

  var Atelier = {
    moneyFormat: (window.Shopify && window.Shopify.money_format) || '${{amount}}',

    getRoot: function (id) {
      return document.getElementById('shopify-section-' + id);
    },

    focusable: function (container) {
      return Array.prototype.slice
        .call(container.querySelectorAll(FOCUSABLE))
        .filter(function (el) {
          return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
        });
    },

    trapFocus: function (container, elementToFocus) {
      var elements = Atelier.focusable(container);
      var first = elements[0];
      var last = elements[elements.length - 1];

      Atelier.removeTrapFocus();

      trapHandlers.keydown = function (event) {
        if (event.code !== 'Tab' && event.key !== 'Tab') return;
        if (event.target === last && !event.shiftKey) {
          event.preventDefault();
          if (first) first.focus();
        }
        if ((event.target === container || event.target === first) && event.shiftKey) {
          event.preventDefault();
          if (last) last.focus();
        }
      };

      document.addEventListener('keydown', trapHandlers.keydown);
      (elementToFocus || first || container).focus();
    },

    removeTrapFocus: function (elementToFocus) {
      if (trapHandlers.keydown) document.removeEventListener('keydown', trapHandlers.keydown);
      trapHandlers = {};
      if (elementToFocus && typeof elementToFocus.focus === 'function') elementToFocus.focus();
    },

    debounce: function (fn, wait) {
      var t;
      return function () {
        var ctx = this;
        var args = arguments;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(ctx, args); }, wait || 0);
      };
    },

    throttle: function (fn, limit) {
      var waiting = false;
      return function () {
        var ctx = this;
        var args = arguments;
        if (!waiting) {
          fn.apply(ctx, args);
          waiting = true;
          setTimeout(function () { waiting = false; }, limit || 0);
        }
      };
    },

    fetchConfig: function (type) {
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/' + (type || 'json')
        }
      };
    },

    formatMoney: function (cents, format) {
      if (typeof cents === 'string') cents = cents.replace('.', '');
      var fmt = format || Atelier.moneyFormat;
      var placeholder = /\{\{\s*(\w+)\s*\}\}/;

      function withCommas(number) {
        return number.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
      }
      function format2(num, precision, thousands, decimal) {
        precision = isNaN(precision) ? 2 : precision;
        thousands = thousands || ',';
        decimal = decimal || '.';
        if (isNaN(num) || num == null) return '0';
        num = (num / 100.0).toFixed(precision);
        var parts = num.split('.');
        var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        var cents2 = parts[1] ? decimal + parts[1] : '';
        return dollars + cents2;
      }

      var value = '';
      var match = fmt.match(placeholder);
      var token = match ? match[1] : 'amount';
      switch (token) {
        case 'amount': value = format2(cents, 2); break;
        case 'amount_no_decimals': value = format2(cents, 0); break;
        case 'amount_with_comma_separator': value = format2(cents, 2, '.', ','); break;
        case 'amount_no_decimals_with_comma_separator': value = format2(cents, 0, '.', ','); break;
        case 'amount_with_space_separator': value = format2(cents, 2, ' ', ','); break;
        case 'amount_no_decimals_with_space_separator': value = format2(cents, 0, ' ', ''); break;
        default: value = format2(cents, 2);
      }
      return fmt.replace(placeholder, value);
    }
  };
  /* withCommas is intentionally available for future use without breaking the API */
  window.Atelier = Atelier;

  /* ---------- Scroll reveal ---------- */
  function ScrollAnimator() {
    this.selector = '[data-animate], [data-animate-scale], [data-animate-left], [data-animate-right], .reveal-lines';
    this.enabled =
      document.body.getAttribute('data-scroll-animations') !== 'false' &&
      !reducedMotion.matches &&
      !isDesignMode() &&
      'IntersectionObserver' in window;
    this.observer = null;
    this.init();
    this.onSectionLoad = this.onSectionLoad.bind(this);
    document.addEventListener('shopify:section:load', this.onSectionLoad);
  }
  ScrollAnimator.prototype.revealAll = function (scope) {
    var nodes = (scope || document).querySelectorAll(this.selector);
    Array.prototype.forEach.call(nodes, function (el) { el.classList.add('is-visible'); });
  };
  ScrollAnimator.prototype.init = function () {
    if (!this.enabled) { this.revealAll(document); return; }
    var self = this;
    this.observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            self.observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    this.observe(document);
  };
  ScrollAnimator.prototype.observe = function (scope) {
    if (!this.observer) { this.revealAll(scope); return; }
    var self = this;
    var nodes = (scope || document).querySelectorAll(this.selector);
    Array.prototype.forEach.call(nodes, function (el) {
      if (!el.classList.contains('is-visible')) self.observer.observe(el);
    });
  };
  ScrollAnimator.prototype.onSectionLoad = function (event) {
    if (!this.enabled) { this.revealAll(event.target); return; }
    this.observe(event.target);
  };

  /* ---------- <quantity-input> ---------- */
  var QuantityInput = (function () {
    function QuantityInput() { return Reflect.construct(HTMLElement, [], QuantityInput); }
    QuantityInput.prototype = Object.create(HTMLElement.prototype);
    QuantityInput.prototype.constructor = QuantityInput;

    QuantityInput.prototype.connectedCallback = function () {
      this.input = this.querySelector('.quantity__input');
      this.buttons = Array.prototype.slice.call(this.querySelectorAll('[data-quantity-action]'));
      this.changeEvent = new Event('change', { bubbles: true });
      this.onClick = this.onClick.bind(this);
      this.buttons.forEach((b) => b.addEventListener('click', this.onClick));
      if (this.input) this.input.addEventListener('change', this.validate.bind(this));
    };
    QuantityInput.prototype.disconnectedCallback = function () {
      this.buttons.forEach((b) => b.removeEventListener('click', this.onClick));
    };
    QuantityInput.prototype.onClick = function (event) {
      event.preventDefault();
      if (!this.input) return;
      var action = event.currentTarget.getAttribute('data-quantity-action');
      var previous = this.input.value;
      if (action === 'increase') this.input.stepUp();
      else this.input.stepDown();
      if (previous !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    };
    QuantityInput.prototype.validate = function () {
      var min = parseInt(this.input.min || '0', 10);
      if (this.input.value !== '' && parseInt(this.input.value, 10) < min) this.input.value = min;
    };
    return QuantityInput;
  })();

  /* ---------- <header-component> ---------- */
  var HeaderComponent = (function () {
    function HeaderComponent() { return Reflect.construct(HTMLElement, [], HeaderComponent); }
    HeaderComponent.prototype = Object.create(HTMLElement.prototype);
    HeaderComponent.prototype.constructor = HeaderComponent;

    HeaderComponent.prototype.connectedCallback = function () {
      this.menuToggle = this.querySelector('[data-menu-toggle]');
      this.menuDrawer = this.querySelector('[data-menu-drawer]');
      this.searchToggle = this.querySelector('[data-search-toggle]');
      this.searchModal = this.querySelector('[data-search-modal]');
      this.overlay = this.querySelector('[data-header-overlay]');
      this.submenuToggles = Array.prototype.slice.call(this.querySelectorAll('[data-submenu-toggle]'));
      this.lastScroll = 0;

      this.onScroll = Atelier.throttle(this.handleScroll.bind(this), 120);
      this.onKeydown = this.handleKeydown.bind(this);
      this.toggleMenu = this.toggleMenu.bind(this);
      this.toggleSearch = this.toggleSearch.bind(this);
      this.closeAll = this.closeAll.bind(this);
      this.onSubmenuClick = this.onSubmenuClick.bind(this);
      this.onOutsideClick = this.onOutsideClick.bind(this);

      window.addEventListener('scroll', this.onScroll, { passive: true });
      document.addEventListener('keydown', this.onKeydown);
      document.addEventListener('click', this.onOutsideClick);
      if (this.menuToggle) this.menuToggle.addEventListener('click', this.toggleMenu);
      if (this.searchToggle) this.searchToggle.addEventListener('click', this.toggleSearch);
      if (this.overlay) this.overlay.addEventListener('click', this.closeAll);
      this.submenuToggles.forEach((t) => t.addEventListener('click', this.onSubmenuClick));
      this.querySelectorAll('[data-menu-close]').forEach((b) => b.addEventListener('click', this.closeAll));
    };

    HeaderComponent.prototype.disconnectedCallback = function () {
      window.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('keydown', this.onKeydown);
      document.removeEventListener('click', this.onOutsideClick);
    };

    HeaderComponent.prototype.handleScroll = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      this.classList.toggle('header--scrolled', y > 12);
      this.lastScroll = y;
    };

    HeaderComponent.prototype.handleKeydown = function (event) {
      if (event.key === 'Escape') this.closeAll();
    };

    HeaderComponent.prototype.onOutsideClick = function (event) {
      if (this.classList.contains('header--menu-open') || this.classList.contains('header--search-open')) return;
      if (!this.contains(event.target)) this.closeOpenSubmenus();
    };

    HeaderComponent.prototype.toggleMenu = function () {
      var open = !this.classList.contains('header--menu-open');
      this.setState('menu', open);
    };

    HeaderComponent.prototype.toggleSearch = function () {
      var open = !this.classList.contains('header--search-open');
      this.setState('search', open);
    };

    HeaderComponent.prototype.setState = function (which, open) {
      this.closeOpenSubmenus();
      this.classList.toggle('header--menu-open', which === 'menu' && open);
      this.classList.toggle('header--search-open', which === 'search' && open);
      var active = this.classList.contains('header--menu-open') || this.classList.contains('header--search-open');
      document.documentElement.classList.toggle('no-scroll', active);

      if (which === 'menu') {
        if (this.menuToggle) this.menuToggle.setAttribute('aria-expanded', String(open));
        if (open && this.menuDrawer) Atelier.trapFocus(this.menuDrawer);
        else if (!open) Atelier.removeTrapFocus(this.menuToggle);
      }
      if (which === 'search') {
        if (this.searchToggle) this.searchToggle.setAttribute('aria-expanded', String(open));
        if (open && this.searchModal) {
          var field = this.searchModal.querySelector('input[type="search"]');
          Atelier.trapFocus(this.searchModal, field);
        } else if (!open) {
          Atelier.removeTrapFocus(this.searchToggle);
        }
      }
    };

    HeaderComponent.prototype.closeAll = function () {
      this.classList.remove('header--menu-open', 'header--search-open');
      document.documentElement.classList.remove('no-scroll');
      if (this.menuToggle) this.menuToggle.setAttribute('aria-expanded', 'false');
      if (this.searchToggle) this.searchToggle.setAttribute('aria-expanded', 'false');
      this.closeOpenSubmenus();
      Atelier.removeTrapFocus();
    };

    HeaderComponent.prototype.onSubmenuClick = function (event) {
      var toggle = event.currentTarget;
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      this.closeOpenSubmenus(toggle);
      toggle.setAttribute('aria-expanded', String(!expanded));
    };

    HeaderComponent.prototype.closeOpenSubmenus = function (except) {
      this.submenuToggles.forEach(function (t) {
        if (t !== except) t.setAttribute('aria-expanded', 'false');
      });
    };

    return HeaderComponent;
  })();

  /* ---------- <facet-form> ----------
     Progressive enhancement: auto-submits the filter/sort form on
     change. The form keeps real submit buttons so it works with JS
     off. Debounced so multiple quick toggles batch into one submit. */
  var FacetForm = (function () {
    function FacetForm() { return Reflect.construct(HTMLElement, [], FacetForm); }
    FacetForm.prototype = Object.create(HTMLElement.prototype);
    FacetForm.prototype.constructor = FacetForm;

    FacetForm.prototype.connectedCallback = function () {
      this.form = this.querySelector('form');
      this.setAttribute('data-enhanced', '');
      this.onChange = Atelier.debounce(this.submit.bind(this), 400);
      if (this.form) this.form.addEventListener('input', this.onChange);
    };
    FacetForm.prototype.disconnectedCallback = function () {
      if (this.form) this.form.removeEventListener('input', this.onChange);
    };
    FacetForm.prototype.submit = function () {
      if (this.form) this.form.submit();
    };
    return FacetForm;
  })();

  /* ---------- Page loading screen ----------
     Shows once per session. Defensive around sessionStorage so a storage
     exception can never leave the overlay stuck. Reduced-motion hides it
     via CSS; this still flips is-done so state stays consistent. */
  function initLoader() {
    var loader = document.getElementById('site-loader');
    if (!loader) return;
    var seen = false;
    try { seen = sessionStorage.getItem('atelier-loaded') === '1'; } catch (e) {}
    if (seen) {
      loader.classList.add('is-done');
      return;
    }
    var count = loader.querySelectorAll('.site-loader__letters span').length;
    var duration = count * 60 + 600;
    setTimeout(function () {
      loader.classList.add('is-done');
      try { sessionStorage.setItem('atelier-loaded', '1'); } catch (e) {}
    }, duration);
  }

  /* ---------- Custom cursor ----------
     Lerp-follow dot that grows to a VIEW badge over images and becomes a
     short rule over buttons. Shown on all pointer devices; hidden only on
     touch / coarse pointers (via CSS). Hover detection is delegated at the
     document level so it works for sections loaded after init too. */
  function CursorComponent() {
    this.el = document.getElementById('custom-cursor');
    if (!this.el) return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (document.body.dataset.customCursor === 'false') return;
    var self = this;
    this.x = 0; this.y = 0; this.cx = 0; this.cy = 0;
    this.tick = this.tick.bind(this);
    document.addEventListener('mousemove', function (e) { self.x = e.clientX; self.y = e.clientY; });
    document.addEventListener('mouseleave', function () { self.el.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { self.el.style.opacity = '1'; });
    var img = '.product-card__media, .product-card img, .gallery__item, .gallery__item img, .split-media__media, .split-media__media img, .hero__media, .hero__media img, .image-with-text__media, .full-bleed-image, figure, [data-gallery-image]';
    var btn = 'a[href], button, [role="button"], input, textarea, select, label, summary, .btn, .nav-link, .sidebar-nav__sublink, .product-card__quick-add, .trust-badge, .quantity__button, [data-share-trigger], .breadcrumbs__link, footer a';
    document.addEventListener('mouseover', function (e) {
      var isImg = e.target.closest(img);
      var isBtn = !isImg && e.target.closest(btn);
      self.el.classList.toggle('is-hovering-image', !!isImg);
      self.el.classList.toggle('is-hovering-btn', !!isBtn);
    });
    this.tick();
  }
  CursorComponent.prototype.tick = function () {
    this.cx += (this.x - this.cx) * 0.12;
    this.cy += (this.y - this.cy) * 0.12;
    this.el.style.transform = 'translate(' + (this.cx - this.el.offsetWidth / 2) + 'px, ' + (this.cy - this.el.offsetHeight / 2) + 'px)';
    requestAnimationFrame(this.tick);
  };

  /* ---------- <localization-dropdown> ---------- */
  var LocalizationDropdown = (function () {
    function LocalizationDropdown() { return Reflect.construct(HTMLElement, [], LocalizationDropdown); }
    LocalizationDropdown.prototype = Object.create(HTMLElement.prototype);
    LocalizationDropdown.prototype.constructor = LocalizationDropdown;

    LocalizationDropdown.prototype.connectedCallback = function () {
      var self = this;
      this.btns = Array.prototype.slice.call(this.querySelectorAll('.localization-selector__btn'));
      this.onDocClick = this.onDocClick.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var list = document.getElementById(btn.getAttribute('aria-controls'));
          var isOpen = btn.getAttribute('aria-expanded') === 'true';
          self.closeAll();
          if (!isOpen) {
            btn.setAttribute('aria-expanded', 'true');
            if (list) list.hidden = false;
          }
        });
      });
      document.addEventListener('click', this.onDocClick);
      this.addEventListener('keydown', this.onKeydown);
    };
    LocalizationDropdown.prototype.closeAll = function () {
      this.btns.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
        var list = document.getElementById(btn.getAttribute('aria-controls'));
        if (list) list.hidden = true;
      });
    };
    LocalizationDropdown.prototype.onDocClick = function (event) {
      if (this.contains(event.target)) return;
      this.closeAll();
    };
    LocalizationDropdown.prototype.onKeydown = function (event) {
      if (event.key !== 'Escape') return;
      var open = this.btns.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
      this.closeAll();
      if (open) open.focus();
    };
    LocalizationDropdown.prototype.disconnectedCallback = function () {
      document.removeEventListener('click', this.onDocClick);
      this.removeEventListener('keydown', this.onKeydown);
    };
    return LocalizationDropdown;
  })();

  /* ---------- Register ---------- */
  function define(name, ctor) {
    if (!customElements.get(name)) customElements.define(name, ctor);
  }

  /* ---------- Scroll-to-top button ----------
     Appears past 400px; routes through Lenis when present, else native smooth. */
  function ScrollTopButton() {
    var btn = document.getElementById('scroll-top-btn');
    if (!btn) return;
    btn.removeAttribute('hidden');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle('is-visible', window.scrollY > 400);
        ticking = false;
      });
    }, { passive: true });
    btn.addEventListener('click', function () {
      if (window.lenis) { window.lenis.scrollTo(0, { duration: 1.4 }); }
      else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  }

  function boot() {
    initLoader();
    new ScrollAnimator();
    define('quantity-input', QuantityInput);
    define('header-component', HeaderComponent);
    define('facet-form', FacetForm);
    define('localization-dropdown', LocalizationDropdown);
    new CursorComponent();
    new ScrollTopButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ---------- Smooth scroll (Lenis) ----------
     Initialised on window load so the deferred lenis.min.js has executed.
     Disabled in the theme editor (designMode) where Lenis fights the editor. */
  function SmoothScroll() {
    if (window.Shopify && window.Shopify.designMode) return;
    if (document.body.dataset.smoothScroll === 'false') return;
    if (!window.Lenis) return;
    var lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    // Exposed for future GSAP ScrollTrigger integration.
    window.lenis = lenis;
  }
  window.addEventListener('load', SmoothScroll);

  /* In-page anchor links route through Lenis (delegated so it also covers
     links injected after load). Falls back to native scroll without Lenis. */
  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var hash = anchor.getAttribute('href');
    if (!hash || hash.length < 2) return;
    var target = document.querySelector(hash);
    if (target && window.lenis) {
      e.preventDefault();
      window.lenis.scrollTo(target, { offset: -80, duration: 1.2 });
    }
  });
})();
