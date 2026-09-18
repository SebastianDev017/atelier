/*
 * Floating tooltip for any control carrying [data-tooltip].
 *
 * One element appended to <body> and positioned from the control's bounding
 * box, instead of a ::after on the control itself. The pseudo-element version
 * lived inside its container and was clipped by it: the bundle's [+] sits at
 * the right edge of the product column, so "Add to cart" was cut to "Add to ca",
 * and inside the collapsible "See more" rows and the cart-drawer strip (both
 * overflow-clipped) it was sliced at the top as well. Positioned against the
 * viewport it can never be clipped: it sits above the control, flips below
 * when there is no room, and is clamped to the viewport edges.
 *
 * Purely visual (aria-hidden): the control's aria-label stays its accessible
 * name. Shown on hover and on keyboard focus, hidden on leave, blur, scroll and
 * Escape (WCAG 1.4.13 dismissible).
 */
(function () {
  var tip = null;
  var current = null;
  var MARGIN = 8;
  var GAP = 8;

  function node() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'ui-tooltip';
    tip.setAttribute('aria-hidden', 'true');
    tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  }

  function show(target) {
    var text = target.getAttribute('data-tooltip');
    if (!text || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
    current = target;
    var t = node();
    t.textContent = text;
    t.classList.remove('is-visible', 'is-below');
    t.hidden = false;
    var r = target.getBoundingClientRect();
    var w = t.offsetWidth;
    var h = t.offsetHeight;
    var left = r.left + r.width / 2 - w / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - w - MARGIN));
    var top = r.top - h - GAP;
    var below = top < MARGIN;
    if (below) top = r.bottom + GAP;
    t.style.left = Math.round(left) + 'px';
    t.style.top = Math.round(top) + 'px';
    t.style.setProperty('--caret-x', Math.round(r.left + r.width / 2 - left) + 'px');
    t.classList.toggle('is-below', below);
    requestAnimationFrame(function () { if (current === target) t.classList.add('is-visible'); });
  }

  function hide() {
    current = null;
    if (!tip) return;
    tip.classList.remove('is-visible');
    tip.hidden = true;
  }

  function from(e) { return e.target && e.target.closest ? e.target.closest('[data-tooltip]') : null; }

  document.addEventListener('pointerover', function (e) {
    var t = from(e);
    if (t && t !== current) show(t);
  });
  document.addEventListener('pointerout', function (e) {
    var t = from(e);
    if (t && t === current && !t.contains(e.relatedTarget)) hide();
  });
  document.addEventListener('focusin', function (e) {
    var t = from(e);
    if (t && t.matches(':focus-visible')) show(t);
  });
  document.addEventListener('focusout', function (e) {
    if (from(e) === current) hide();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current) hide(); });
  /* Capture: a scroll inside the drawer strip moves the control too. */
  window.addEventListener('scroll', function () { if (current) hide(); }, { passive: true, capture: true });
  /* A control that becomes disabled while hovered (sold out after adding) drops its tip. */
  document.addEventListener('click', function (e) { var t = from(e); if (t && t === current) requestAnimationFrame(function () { if (t.disabled) hide(); }); });
})();
