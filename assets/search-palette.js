/*
 * Command palette search — opens with "/" or the sidebar hint button.
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

  function open() {
    palette.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();
    if (window.gsap) {
      gsap.fromTo(palette.querySelector('.search-palette__panel'),
        { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'expo.out' });
    }
    setTimeout(function () { input.focus(); }, 0);
  }

  function close() {
    palette.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
    input.value = '';
    results.innerHTML = emptyHTML;
    items = [];
    activeIndex = -1;
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

  function render(products) {
    if (!products.length) {
      results.innerHTML = '<div class="search-palette__no-results">' + escapeHtml(results.dataset.noResults || 'No results') + '</div>';
      items = [];
      activeIndex = -1;
      return;
    }
    results.innerHTML = products.map(function (p, i) {
      var img = (p.featured_image && p.featured_image.url) || p.image || '';
      var imgTag = img ? '<img class="search-result-item__img" src="' + img + '" alt="" width="60" height="60" loading="lazy">'
                       : '<span class="search-result-item__img"></span>';
      return '<a class="search-result-item" role="option" href="' + escapeHtml(p.url) + '" data-index="' + i + '">' +
        imgTag +
        '<span class="search-result-item__title">' + escapeHtml(p.title) + '</span>' +
        (p.price != null ? '<span class="search-result-item__price">' + escapeHtml(p.price) + '</span>' : '') +
        '</a>';
    }).join('');
    items = Array.prototype.slice.call(results.querySelectorAll('.search-result-item'));
    activeIndex = -1;
  }

  function setActive(i) {
    if (!items.length) return;
    activeIndex = (i + items.length) % items.length;
    items.forEach(function (el, idx) { el.classList.toggle('is-active', idx === activeIndex); });
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  /* Global keyboard: "/" opens, Escape closes. */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !isInputFocused() && !isOpen()) { e.preventDefault(); open(); return; }
    if (e.key === 'Escape' && isOpen()) { close(); return; }
  });

  /* Sidebar / header hint buttons open it. */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-search-palette-open]');
    if (trigger) { e.preventDefault(); open(); }
    if (e.target.closest('[data-palette-close]')) close();
  });

  input.addEventListener('input', function () {
    var q = input.value.trim();
    clearTimeout(debounceTimer);
    if (q.length < 2) { results.innerHTML = emptyHTML; items = []; activeIndex = -1; return; }
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
