/*
 * Custom cursor.
 *
 * Lives in its own file rather than theme.js for two reasons:
 *   1. theme.js is deferred BEFORE gsap.min.js, so gsap is undefined when
 *      theme.js executes -- gsap.quickTo() below would not exist there.
 *   2. enable_custom_cursor now defaults to false, and layout/theme.liquid only
 *      emits this tag when the setting is on, so the default install ships none
 *      of this code.
 *
 * Position is driven by gsap.quickTo, which interpolates toward the pointer on
 * the GSAP ticker. That matters twice over: the previous implementation ran its
 * own requestAnimationFrame loop while gsap-init.js drives Lenis from the GSAP
 * ticker, so cursor and page scrolled on two unsynchronised loops; and it read
 * el.offsetWidth every frame to centre the dot, forcing a layout on each tick.
 * xPercent/yPercent centre it with no measurement at all.
 *
 * Coordinates are e.clientX/e.clientY -- viewport space. Nothing here reads
 * scrollY, so there is no scroll offset to double-compensate now that Lenis
 * owns the scroll position.
 */
(function () {
  var el = document.getElementById('custom-cursor');
  if (!el) return;
  /* No hover = touch. The CSS hides the dot there too; bailing early also
     avoids binding three document listeners that would never do anything. */
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.body.dataset.customCursor === 'false') return;
  if (!window.gsap) return;

  /* Start hidden and unpositioned. The old version began its follow loop at
     (0,0), so the first pointer move dragged the dot across the whole viewport
     from the top-left corner -- the "teleport" on every page load. */
  el.classList.add('is-cursor-hidden');
  gsap.set(el, { xPercent: -50, yPercent: -50 });

  var moveX = gsap.quickTo(el, 'x', { duration: 0.15, ease: 'power2.out' });
  var moveY = gsap.quickTo(el, 'y', { duration: 0.15, ease: 'power2.out' });
  var primed = false;

  document.addEventListener('mousemove', function (event) {
    if (!primed) {
      /* Jump to the first known position instead of easing in from wherever
         the tween happened to start, then reveal. */
      primed = true;
      gsap.set(el, { x: event.clientX, y: event.clientY });
      el.classList.remove('is-cursor-hidden');
      return;
    }
    moveX(event.clientX);
    moveY(event.clientY);
  });

  /* ---- C1: hide when the pointer genuinely leaves the window ----
     mouseleave does not bubble, so this only fires for the document itself.
     relatedTarget is null on a real exit (leaving the window, or crossing into
     an iframe, where the native pointer takes over because `cursor: none` stops
     at the frame boundary); it is the element being entered when the event came
     from a child, which is the case worth ignoring.

     Toggling a class rather than el.style.opacity is deliberate: an inline
     opacity would outrank `body:has(.cart-drawer.is-open) .custom-cursor`, so
     the first window exit would permanently break the drawer's hide rule. */
  document.addEventListener('mouseleave', function (event) {
    if (event.relatedTarget !== null) return;
    el.classList.add('is-cursor-hidden');
  });
  document.addEventListener('mouseenter', function (event) {
    if (event.relatedTarget !== null) return;
    if (primed) el.classList.remove('is-cursor-hidden');
  });
  /* A drag that ends outside the window, or a tab switch, leaves no mouseleave
     behind. Without this the dot stays frozen mid-page until the next move. */
  window.addEventListener('blur', function () { el.classList.add('is-cursor-hidden'); });

  /* ---- C2/C3: hover states ----
     Delegated on document, so cart-drawer items, Flip-animated collection
     results and anything else injected after load are covered with no rebinding.

     Images keep the CSS width/height growth (the VIEW label has to stay legible,
     which a transform scale would not do). Everything else clickable takes a
     GSAP scale -- the dot used to morph into a 40x2px rule over buttons, which
     read as a glitch rather than as an affordance. */
  var IMAGE = '.gallery__item, .gallery__item img, .split-media__media, .split-media__media img, .hero__media, .hero__media img, .image-with-text__media, .full-bleed-image, [data-gallery-image]';
  var CLICKABLE = 'a[href], button, [role="button"], input, textarea, select, label, summary, .btn, .product-card, .nav-link, .sidebar-nav__sublink, .trust-badge, [data-share-trigger]';
  var scaled = false;

  document.addEventListener('mouseover', function (event) {
    var overImage = !!(event.target.closest && event.target.closest(IMAGE));
    var overClickable = !overImage && !!(event.target.closest && event.target.closest(CLICKABLE));
    el.classList.toggle('is-hovering-image', overImage);
    el.classList.toggle('is-hovering-btn', overClickable);
    /* Only tween on a state change -- mouseover fires for every descendant
       crossed, and restarting the tween on each one visibly stutters. */
    if (overClickable === scaled) return;
    scaled = overClickable;
    gsap.to(el, { scale: overClickable ? 1.8 : 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
})();
