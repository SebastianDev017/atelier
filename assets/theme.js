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
      /* The palette is a modal dialog, not a disclosure: describe the icon that
         way when it opens the palette instead of the takeover. */
      if (this.searchToggle && document.getElementById('search-palette')) {
        this.searchToggle.removeAttribute('aria-expanded');
        this.searchToggle.setAttribute('aria-controls', 'search-palette');
        this.searchToggle.setAttribute('aria-haspopup', 'dialog');
      }
      if (this.overlay) this.overlay.addEventListener('click', this.closeAll);
      this.submenuToggles.forEach((t) => t.addEventListener('click', this.onSubmenuClick));
      this.querySelectorAll('[data-menu-close]').forEach((b) => b.addEventListener('click', this.closeAll));
      this.initLogoFit();
      this.initSidebarCollapse();
    };

    /* ---------- Retractable desktop sidebar (SB2-SB5) ----------
       Two classes on <html>, both applied before first paint by
       layout/theme.liquid: sidebar-collapsed is what the sidebar LOOKS like
       (header.liquid swaps the expanded content for the rail), sidebar-rail is
       how wide it IS (base.css sets --sidebar-width to the rail width, and the
       grid column, the sticky add-to-cart bar and the recently-viewed pill all
       read that variable).

       The width is never animated through the variable: a custom property on
       <html> is inherited by every element, so each change restyled the whole
       page (43ms a frame on the demo homepage). With GSAP -- when
       AnimSettings.ui allows it, which covers anim_disable_all and reduced
       motion -- the grid column and every [data-follows-sidebar] element's left
       edge are tweened inline, and sidebar-rail flips once, when the motion has
       finished. Otherwise sidebar-rail flips up front and base.css's plain
       transitions carry it. Either way both toggles' aria-expanded stay true to
       the state, focus moves to whichever toggle is now on screen, and the
       choice is remembered. */
    var SIDEBAR_KEY = 'contour-sidebar-collapsed';
    var desktopQuery = window.matchMedia('(min-width: 769px)');

    HeaderComponent.prototype.initSidebarCollapse = function () {
      this.collapseBtn = this.querySelector('[data-sidebar-collapse]');
      this.expandBtn = this.querySelector('[data-sidebar-expand]');
      if (!this.collapseBtn || !this.expandBtn) return;
      var self = this;
      this.onSidebarCollapse = function () { self.setSidebarCollapsed(true); };
      this.onSidebarExpand = function () { self.setSidebarCollapsed(false); };
      /* Another tab changed it: follow without animating or stealing focus. */
      this.onSidebarStorage = function (event) {
        if (event.key === SIDEBAR_KEY) self.setSidebarCollapsed(event.newValue === '1', { animate: false, persist: false, focus: false });
      };
      this.collapseBtn.addEventListener('click', this.onSidebarCollapse);
      this.expandBtn.addEventListener('click', this.onSidebarExpand);
      window.addEventListener('storage', this.onSidebarStorage);
      this.syncSidebarState(document.documentElement.classList.contains('sidebar-collapsed'));
    };

    HeaderComponent.prototype.syncSidebarState = function (collapsed) {
      var expanded = String(!collapsed);
      this.collapseBtn.setAttribute('aria-expanded', expanded);
      this.expandBtn.setAttribute('aria-expanded', expanded);
    };

    /* Land the width state on the visual one and drop every inline value the
       tween wrote, in one go, so the CSS takes over at the same numbers. */
    HeaderComponent.prototype.settleSidebar = function () {
      var root = document.documentElement;
      if (this.sidebarTween) { this.sidebarTween.kill(); this.sidebarTween = null; }
      clearTimeout(this.sidebarTimer);
      root.classList.toggle('sidebar-rail', root.classList.contains('sidebar-collapsed'));
      if (this.sidebarMotion) {
        this.sidebarMotion.grid.style.removeProperty('grid-template-columns');
        this.sidebarMotion.followers.forEach(function (f) { f.el.style.removeProperty('left'); });
        this.sidebarMotion = null;
      }
      root.classList.remove('sidebar-animating', 'sidebar-gsap', 'sidebar-animating-css');
      /* Pinned sections and the horizontal scroller measured the old width. */
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };

    HeaderComponent.prototype.setSidebarCollapsed = function (collapsed, opts) {
      opts = opts || {};
      var root = document.documentElement;
      if (root.classList.contains('sidebar-collapsed') === collapsed) return;
      var animate = opts.animate !== false && desktopQuery.matches;
      var useGsap = animate && Boolean(window.gsap) && Boolean(window.AnimSettings && window.AnimSettings.ui);
      var self = this;

      /* The rail is one screen tall; a column scrolled down its long nav would
         otherwise carry the rail up with it. */
      var column = this.closest('.shopify-section');
      if (collapsed && column) column.scrollTop = 0;

      /* Toggled again mid-flight: carry on from wherever the width is now. */
      var motion = this.sidebarMotion;
      if (this.sidebarTween) { this.sidebarTween.kill(); this.sidebarTween = null; }
      clearTimeout(this.sidebarTimer);
      var styles = getComputedStyle(root);
      var fromPx = motion ? motion.box.w : parseFloat(styles.getPropertyValue('--sidebar-width'));
      var toPx = parseFloat(styles.getPropertyValue(collapsed ? '--sidebar-rail-width' : '--sidebar-width-expanded'));

      /* The look changes now (the rules it drives are scoped to the sidebar). */
      root.classList.toggle('sidebar-collapsed', collapsed);
      this.syncSidebarState(collapsed);
      if (opts.persist !== false) {
        try { localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch (e) {}
      }

      if (useGsap && !isNaN(fromPx) && !isNaN(toPx)) {
        root.classList.remove('sidebar-animating-css');
        root.classList.add('sidebar-animating', 'sidebar-gsap');
        if (!motion) {
          var grid = document.querySelector('.site-layout');
          var followers = Array.prototype.slice.call(document.querySelectorAll('[data-follows-sidebar]'))
            .filter(function (el) { return el.getClientRects().length > 0; })
            .map(function (el) { return { el: el, offset: parseFloat(getComputedStyle(el).left) - fromPx }; });
          motion = this.sidebarMotion = { grid: grid, followers: followers, box: { w: fromPx } };
        }
        var paint = function () {
          var w = motion.box.w;
          if (motion.grid) motion.grid.style.gridTemplateColumns = w + 'px 1fr';
          motion.followers.forEach(function (f) { f.el.style.left = (w + f.offset) + 'px'; });
        };
        paint();
        this.sidebarTween = gsap.to(motion.box, {
          w: toPx, duration: 0.35, ease: 'power2.inOut', onUpdate: paint,
          onComplete: function () { self.sidebarTween = null; self.settleSidebar(); }
        });
        gsap.fromTo(this.querySelectorAll('.sidebar__chevron'),
          { rotation: collapsed ? 0 : 180 },
          { rotation: collapsed ? 180 : 0, duration: 0.3, ease: 'power2.inOut', clearProps: 'transform' });
      } else {
        if (motion) this.settleSidebar();
        if (animate) {
          root.classList.add('sidebar-animating', 'sidebar-animating-css');
          root.classList.toggle('sidebar-rail', collapsed);
          this.sidebarTimer = setTimeout(function () { self.settleSidebar(); }, 400);
        } else {
          this.settleSidebar();
        }
      }

      /* The control that was pressed has just been hidden; hand focus to the
         one that replaced it so a keyboard user is never dropped on <body>. */
      if (opts.focus !== false) {
        var target = collapsed ? this.expandBtn : this.collapseBtn;
        requestAnimationFrame(function () { target.focus({ preventScroll: true }); });
      }
    };

    /* The CSS cap on the text wordmark is an estimate (~0.95em per character);
       a merchant's font can be wider still. Once the real font has loaded, and
       whenever the column changes width, trim the size until the name fits its
       row. It never grows past the CSS size and stops at the 14px floor; a name
       that still cannot fit then breaks onto a second line (the CSS
       overflow-wrap), which is switched off while measuring so shrinking is
       always tried before breaking. */
    HeaderComponent.prototype.initLogoFit = function () {
      var text = this.querySelector('[data-logo-fit]');
      if (!text) return;
      var row = text.closest('.sidebar__head') || text.parentElement;
      var FLOOR = 14;
      var fit = function () {
        text.style.fontSize = '';
        text.style.overflowWrap = 'normal';
        var size = parseFloat(getComputedStyle(text).fontSize);
        var avail = row.clientWidth;
        while (text.scrollWidth > avail + 0.5 && size > FLOOR) {
          size = Math.max(FLOOR, size - 0.5);
          text.style.fontSize = size + 'px';
        }
        text.style.overflowWrap = '';
      };
      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
      if ('ResizeObserver' in window) {
        this.logoObserver = new ResizeObserver(fit);
        this.logoObserver.observe(row);
      }
    };

    HeaderComponent.prototype.disconnectedCallback = function () {
      if (this.logoObserver) this.logoObserver.disconnect();
      if (this.onSidebarStorage) window.removeEventListener('storage', this.onSidebarStorage);
      /* Re-rendered mid-toggle (theme editor): never leave a half-way width. */
      if (this.sidebarTween || this.sidebarMotion) this.settleSidebar();
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

    /* When the command palette exists, the search icon belongs to it
       (search-palette.js handles [data-search-palette-open]); the takeover is
       only the fallback for a store that has switched the palette off. */
    HeaderComponent.prototype.toggleSearch = function () {
      if (document.getElementById('search-palette')) return;
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

    function prefersReduced() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    FacetForm.prototype.connectedCallback = function () {
      this.form = this.querySelector('form');
      this.setAttribute('data-enhanced', '');
      this.onChange = Atelier.debounce(this.onInput.bind(this), 400);
      this.onClick = this.onClick.bind(this);
      this.onPop = this.onPop.bind(this);
      if (this.form) this.form.addEventListener('input', this.onChange);
      this.addEventListener('click', this.onClick);
      window.addEventListener('popstate', this.onPop);
    };
    FacetForm.prototype.disconnectedCallback = function () {
      if (this.form) this.form.removeEventListener('input', this.onChange);
      this.removeEventListener('click', this.onClick);
      window.removeEventListener('popstate', this.onPop);
    };

    /* "Clear all" / active-filter links AJAX too (else full reload). */
    FacetForm.prototype.onClick = function (e) {
      var link = e.target.closest('a.facets-panel__clear, a[data-facet-link]');
      if (!link || !window.fetch) return;
      e.preventDefault();
      this.navigate(link.getAttribute('href'), false);
    };

    FacetForm.prototype.onInput = function () { this.navigate(this.buildURL(), false); };
    FacetForm.prototype.onPop = function () { this.navigate(window.location.pathname + window.location.search, true); };

    FacetForm.prototype.buildURL = function () {
      if (!this.form) return window.location.pathname;
      var params = new URLSearchParams();
      new FormData(this.form).forEach(function (v, k) {
        if (v !== '' && v != null) params.append(k, v);
      });
      var qs = params.toString();
      return window.location.pathname + (qs ? '?' + qs : '');
    };

    /* Fetch the filtered page and swap results (Flip-morphed) + facets + count +
       URL. Any failure falls back to a normal navigation so filtering never breaks. */
    FacetForm.prototype.navigate = function (url, isPop) {
      var self = this;
      var results = document.querySelector('.collection__results');
      if (!results || !window.fetch || !window.DOMParser) { if (this.form) this.form.submit(); return; }
      results.setAttribute('aria-busy', 'true');
      fetch(url)
        .then(function (r) { if (!r.ok) throw 0; return r.text(); })
        .then(function (html) {
          self.swap(new DOMParser().parseFromString(html, 'text/html'), results);
          if (!isPop) history.pushState({ atelierFacet: true }, '', url);
          results.setAttribute('aria-busy', 'false');
        })
        .catch(function () { window.location.href = url; });
    };

    FacetForm.prototype.swap = function (doc, results) {
      var grid = results.querySelector('[data-product-grid]');
      var view = grid ? grid.dataset.view : null;
      var newResults = doc.querySelector('.collection__results');
      /* AnimSettings.ui covers prefers-reduced-motion and anim_disable_all.
         prefersReduced() is kept for the other places in this file that use it. */
      var animate = window.Flip && window.gsap && window.AnimSettings && window.AnimSettings.ui && grid;
      var state = animate ? Flip.getState('[data-product-grid] [data-flip-id]') : null;

      if (newResults) results.innerHTML = newResults.innerHTML;
      var newGrid = results.querySelector('[data-product-grid]');
      if (newGrid && view) newGrid.dataset.view = view;

      if (animate && state) {
        Flip.from(state, {
          duration: 0.5, ease: 'power2.inOut', absolute: true, nested: true,
          onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }); },
          onLeave: function (els) { return gsap.to(els, { opacity: 0, duration: 0.25 }); }
        });
      }

      /* Refresh the facet panel (counts + active states); keep the form node so
         its listeners survive. */
      var newForm = doc.querySelector('[data-facet-form]');
      if (newForm && this.form) this.form.innerHTML = newForm.innerHTML;

      /* Refresh the product count. */
      var newCount = doc.querySelector('.collection__count');
      var curCount = document.querySelector('.collection__count');
      if (newCount && curCount) curCount.innerHTML = newCount.innerHTML;

      if (window.ScrollTrigger) ScrollTrigger.refresh();
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

  /* The custom cursor moved to assets/cursor.js. theme.js is deferred before
     gsap.min.js, so gsap.quickTo() -- which now drives the dot on the same
     ticker as Lenis -- is not defined at this point in the load order. The new
     file is also emitted only when enable_custom_cursor is on. */

  /* ---------- <localization-dropdown> ---------- */
  var LocalizationDropdown = (function () {
    function LocalizationDropdown() { return Reflect.construct(HTMLElement, [], LocalizationDropdown); }
    LocalizationDropdown.prototype = Object.create(HTMLElement.prototype);
    LocalizationDropdown.prototype.constructor = LocalizationDropdown;

    LocalizationDropdown.prototype.connectedCallback = function () {
      var self = this;
      this.btns = Array.prototype.slice.call(this.querySelectorAll('[data-localization-trigger]'));
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

  /* Sold-out "Notify me" <dialog>: open/close + AJAX submit to the contact form.
     Escape, backdrop and close-button all route through the native dialog `close`
     event, which resets aria-expanded and restores focus to the trigger. */
  class NotifyMe {
    constructor(el) {
      this.dialog = el.querySelector('[data-notify-dialog]');
      this.trigger = el.querySelector('[data-notify-trigger]');
      this.form = el.querySelector('.notify-me__form');
      this.success = el.querySelector('.notify-me__success');
      if (!this.trigger || !this.dialog) return;
      this.trigger.addEventListener('click', () => this.open());
      el.querySelector('[data-notify-close]')?.addEventListener('click', () => this.dialog.close());
      this.dialog.addEventListener('click', (e) => { if (e.target === this.dialog) this.dialog.close(); });
      this.dialog.addEventListener('close', () => {
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.focus();
      });
      this.form?.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
    }
    open() {
      this.dialog.showModal();
      this.trigger.setAttribute('aria-expanded', 'true');
      this.dialog.querySelector('input[type="email"]')?.focus();
    }
    async submit() {
      try {
        const resp = await fetch('/contact', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          body: new URLSearchParams(new FormData(this.form))
        });
        if (resp.ok && this.success) {
          this.form.hidden = true;
          this.success.hidden = false;
          setTimeout(() => this.dialog.close(), 3000);
        }
      } catch (err) {
        /* Network failure — leave the form in place so the shopper can retry. */
      }
    }
  }

  function boot() {
    initLoader();
    /* ScrollAnimator (IntersectionObserver reveals) disabled — GSAP
       (assets/gsap-animations.js) owns all scroll reveals now. */
    define('quantity-input', QuantityInput);
    define('header-component', HeaderComponent);
    define('facet-form', FacetForm);
    define('localization-dropdown', LocalizationDropdown);
    new ScrollTopButton();
    document.querySelectorAll('.notify-me').forEach((el) => new NotifyMe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Re-init Notify me when a section is re-rendered in the theme editor. */
  document.addEventListener('shopify:section:load', (e) => {
    e.target.querySelectorAll('.notify-me').forEach((el) => new NotifyMe(el));
  });

  /* ---------- Smooth scroll (Lenis) ----------
     Lenis is now created + driven in assets/gsap-init.js, where it shares ONE
     rAF loop with the GSAP ticker / ScrollTrigger and exposes window.lenis.
     (Driving it here too would double-advance Lenis and break scrolling.) */

  /* In-page anchor links route through Lenis (delegated so it also covers
     links injected after load). Falls back to native scroll without Lenis. */
  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var hash = anchor.getAttribute('href');
    if (!hash || hash.length < 2) return;
    var target = document.querySelector(hash);
    if (!target) return;
    /* Under reduced motion, hand the click back to the browser: native hash
       navigation is unanimated and moves focus correctly on its own. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.lenis) return;
    e.preventDefault();
    window.lenis.scrollTo(target, { offset: -80, duration: 1.2 });
    /* preventDefault also cancels the browser's focus move, which is the only
       thing that makes a skip link work. Without this the page scrolls but
       focus stays on the link, so the next Tab goes straight back into the
       navigation the user was skipping (WCAG 2.4.1 Bypass Blocks). */
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();
