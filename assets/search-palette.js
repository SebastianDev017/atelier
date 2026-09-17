/*
 * Command palette search — opens with "/" or the sidebar's search icon.
 * Queries Shopify Predictive Search (/search/suggest.json). Arrow keys move the
 * active result, Enter navigates, Escape / backdrop closes. GSAP-animated open
 * with a graceful no-animation fallback.
 */
(function () {
  var palette = document.getElementById('search-palette');
  if (!palette) return;

  var input = document.getElementById('search-palette-input');
  var results = document.getElementById('search-palette-results');
  var emptyHTML = results.innerHTML;
  var activeIndex = -1;
  var items = [];
  var debounceTimer;

  function isInputFocused() {
    var el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  var returnFocus = null;

  function open() {
    /* Remember what opened it, so closing hands focus back to that control
       (the sidebar search icon) instead of dropping it on <body>. */
    returnFocus = document.activeElement;
    palette.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();
    /* This was the only GSAP call in the theme with no guard whatsoever --
       not even prefers-reduced-motion. The panel is shown by the aria-hidden
       flip above regardless, so skipping the tween leaves it fully usable. */
    if (window.gsap && window.AnimSettings && window.AnimSettings.ui) {
      gsap.fromTo(palette.querySelector('.search-palette__panel'),
        { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'expo.out' });
    }
    setTimeout(function () { input.focus(); }, 0);
    /* role="dialog" aria-modal="true" promises focus stays inside; without a
       trap, Tab from the last result walked into the page behind the palette.
       Same helper the cart drawer uses. */
    if (window.Atelier && Atelier.trapFocus) {
      setTimeout(function () { Atelier.trapFocus(palette.querySelector('.search-palette__panel'), input); }, 0);
    }
  }

  function close() {
    clearTimeout(debounceTimer);
    palette.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
    input.value = '';
    results.innerHTML = emptyHTML;
    setListbox(false);
    items = [];
    activeIndex = -1;
    if (window.Atelier && Atelier.removeTrapFocus) Atelier.removeTrapFocus();
    if (returnFocus && document.contains(returnFocus) && typeof returnFocus.focus === 'function') returnFocus.focus();
    returnFocus = null;
  }

  function isOpen() { return palette.getAttribute('aria-hidden') === 'false'; }

  async function search(query) {
    try {
      var res = await fetch('/search/suggest.json?q=' + encodeURIComponent(query) +
        '&resources[type]=product&resources[limit]=6&resources[options][unavailable_products]=last');
      if (!res.ok) return [];
      var data = await res.json();
      return (data.resources && data.resources.results && data.resources.results.products) || [];
    } catch (e) { return []; }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* The results box is only a listbox while it holds options. Left as a
     permanent role="listbox" it was an empty listbox with no accessible name
     whenever the palette was idle -- axe: aria-required-children (critical) and
     aria-input-field-name (serious). The combobox input tracks the active
     option through aria-activedescendant. */
  function setListbox(on) {
    if (on) results.setAttribute('role', 'listbox');
    else results.removeAttribute('role');
    input.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (!on) input.setAttribute('aria-activedescendant', '');
  }

  function render(products) {
    /* A response that lands after the palette was closed used to repopulate it:
       the results box went back to role="listbox" with the combobox marked
       expanded while nothing was on screen, and the stale list flashed on the
       next open. */
    if (!isOpen()) return;
    if (!products.length) {
      results.innerHTML = '<div class="search-palette__no-results">' + escapeHtml(results.dataset.noResults || 'No results') + '</div>';
      setListbox(false);
      items = [];
      activeIndex = -1;
      return;
    }
    results.innerHTML = products.map(function (p, i) {
      var img = (p.featured_image && p.featured_image.url) || p.image || '';
      var imgTag = img ? '<img class="search-result-item__img" src="' + img + '" alt="" width="60" height="60" loading="lazy">'
                       : '<span class="search-result-item__img"></span>';
      return '<a class="search-result-item" role="option" id="search-result-' + i + '" aria-selected="false" href="' + escapeHtml(p.url) + '" data-index="' + i + '">' +
        imgTag +
        '<span class="search-result-item__title">' + escapeHtml(p.title) + '</span>' +
        (p.price != null ? '<span class="search-result-item__price">' + escapeHtml(p.price) + '</span>' : '') +
        '</a>';
    }).join('');
    items = Array.prototype.slice.call(results.querySelectorAll('.search-result-item'));
    setListbox(items.length > 0);
    activeIndex = -1;
  }

  function setActive(i) {
    if (!items.length) return;
    activeIndex = (i + items.length) % items.length;
    items.forEach(function (el, idx) {
      var on = idx === activeIndex;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    input.setAttribute('aria-activedescendant', items[activeIndex].id);
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  /* Global keyboard: "/" opens, Escape closes. */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !isInputFocused() && !isOpen()) { e.preventDefault(); open(); return; }
    if (e.key === 'Escape' && isOpen()) { close(); return; }
  });

  /* The sidebar search icon (expanded foot and collapsed rail) opens it. */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-search-palette-open]');
    if (trigger) { e.preventDefault(); open(); }
    if (e.target.closest('[data-palette-close]')) close();
  });

  input.addEventListener('input', function () {
    var q = input.value.trim();
    clearTimeout(debounceTimer);
    if (q.length < 2) { results.innerHTML = emptyHTML; setListbox(false); items = []; activeIndex = -1; return; }
    debounceTimer = setTimeout(async function () {
      render(await search(q));
    }, 200);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
    else if (e.key === 'Enter') {
      if (activeIndex > -1 && items[activeIndex]) { e.preventDefault(); window.location.href = items[activeIndex].href; }
      else if (input.value.trim()) { window.location.href = '/search?q=' + encodeURIComponent(input.value.trim()); }
    }
  });
})();
