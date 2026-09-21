/*
 * Phone arrows for the horizontal product rail.
 *
 * Desktop pins the rail to vertical scroll (gsap-animations.js), so arrows
 * belong to the mobile carousel only: the script bails above the breakpoint and
 * un-hides the controls below it. They are progressive enhancement — the rail
 * scrolls and snaps with a swipe whether or not this file runs, which is why
 * the markup ships hidden and only JS reveals it.
 *
 * Each press moves by one card plus the gap, so a press always lands on a snap
 * point. At either end the corresponding arrow is disabled rather than removed:
 * a control that disappears mid-interaction moves everything beside it.
 */
(function () {
  var MOBILE = '(max-width: 767px)';

  function setup(root) {
    var viewport = root.querySelector('[data-hs-viewport]');
    var nav = root.querySelector('[data-hs-nav]');
    if (!viewport || !nav) return;
    var prev = nav.querySelector('[data-hs-prev]');
    var next = nav.querySelector('[data-hs-next]');
    var mq = window.matchMedia(MOBILE);

    function step() {
      var card = viewport.querySelector('.hs-card');
      if (!card) return viewport.clientWidth * 0.8;
      var styles = getComputedStyle(card.parentNode);
      var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function sync() {
      if (!mq.matches) { nav.hidden = true; return; }
      /* Nothing to page through: one card, or a rail that already fits. */
      var scrollable = viewport.scrollWidth - viewport.clientWidth;
      if (scrollable < 8) { nav.hidden = true; return; }
      nav.hidden = false;
      var x = viewport.scrollLeft;
      /* 2px of slack: sub-pixel widths never resolve to an exact end. */
      prev.disabled = x <= 2;
      next.disabled = x >= scrollable - 2;
    }

    function move(dir) {
      var behavior = (window.AnimSettings && window.AnimSettings.ui) ? 'smooth' : 'auto';
      viewport.scrollBy({ left: dir * step(), behavior: behavior });
    }

    prev.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    viewport.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);
    sync();
  }

  function init(scope) {
    var rails = (scope || document).querySelectorAll('[data-horizontal-scroll]');
    Array.prototype.forEach.call(rails, setup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
