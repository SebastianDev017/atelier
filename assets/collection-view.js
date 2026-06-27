/*
 * Collection grid / editorial-list view toggle.
 * Persists the choice in localStorage and morphs between the two layouts with
 * GSAP Flip (the same product cards reflow, so Flip animates the transition).
 * Reduced-motion and no-Flip both fall back to an instant swap.
 */
(function () {
  var toggle = document.querySelector('[data-collection-view]');
  var grid = document.querySelector('[data-product-grid]');
  if (!toggle || !grid) return;

  var KEY = 'atelier-collection-view';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setButtons(view) {
    toggle.querySelectorAll('[data-view-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.viewBtn === view ? 'true' : 'false');
    });
  }

  function apply(view, animate) {
    if (!view || grid.dataset.view === view) { setButtons(grid.dataset.view); return; }
    if (animate && window.Flip && window.gsap && !reduce) {
      var targets = grid.querySelectorAll('[data-product-card], .product-card__media, .product-card__image, .product-card__primary-img, .product-card__info');
      var state = Flip.getState(targets);
      grid.dataset.view = view;
      Flip.from(state, { duration: 0.5, ease: 'power2.inOut', absolute: true, nested: true });
    } else {
      grid.dataset.view = view;
    }
    setButtons(view);
    try { localStorage.setItem(KEY, view); } catch (e) {}
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* Initial state: a saved preference overrides the section's view_default. */
  var saved;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved && saved !== grid.dataset.view) { grid.dataset.view = saved; }
  setButtons(grid.dataset.view || 'grid');

  toggle.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-view-btn]');
    if (btn) apply(btn.dataset.viewBtn, true);
  });
})();
