/*
 * Page transitions.
 *
 * The theme uses NATIVE cross-document View Transitions
 * (@view-transition { navigation: auto } in layout/theme.liquid) — the correct
 * approach for a multi-page Shopify storefront. A SPA-style
 * document.startViewTransition(() => navigate) does NOT cross-document-animate
 * and would break MPA navigation, so it is intentionally not used.
 *
 * This file is a progressive-enhancement FALLBACK for browsers that don't
 * support cross-document View Transitions: it fades the page out on internal
 * link click, then performs a normal navigation (so nothing breaks). It also
 * refreshes ScrollTrigger after a native transition reveals the new page.
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var supportsCrossDocVT =
    window.CSS && CSS.supports && CSS.supports('selector(::view-transition)');

  /* After a native transition reveals the new page, recalc pinned ScrollTriggers. */
  if (supportsCrossDocVT) {
    window.addEventListener('pagereveal', function () {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
    return;
  }

  /* Fallback: fade out, then navigate. */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (a.hostname && a.hostname !== window.location.hostname) return;     // external
    if (a.protocol !== 'http:' && a.protocol !== 'https:') return;          // mailto/tel/etc.
    if (a.href === window.location.href) return;
    e.preventDefault();
    document.documentElement.classList.add('is-leaving');
    setTimeout(function () { window.location.href = a.href; }, 260);
  });

  /* Restore on bfcache back-navigation so the page isn't left invisible. */
  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('is-leaving');
  });
})();
