/*
 * AnimSettings — one place that decides whether a given class of motion runs.
 *
 * Before this file, gating was scattered: gsap-animations.js read
 * body[data-scroll-animations], cursor.js read body[data-custom-cursor],
 * gsap-init.js read body[data-smooth-scroll], and seven other files checked
 * only prefers-reduced-motion — which is an OS preference, so those effects
 * answered to no theme setting at all. search-palette.js checked nothing.
 *
 * Loaded before every other script in layout/theme.liquid, so
 * window.AnimSettings is always defined by the time a consumer runs. It is
 * plain data: read it at the moment of use, never cache the booleans, because
 * the theme editor can flip data-anim-disable-all between renders.
 *
 * anim_disable_all is the master. When it is on, every derived boolean below
 * is false regardless of the individual toggles — that is the whole point of
 * it: one switch for capturing clean, static screenshots.
 */
(function () {
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function flags() {
    var d = (document.body && document.body.dataset) || {};
    var off = d.animDisableAll === 'true';
    var reduced = mq.matches;
    /* A merchant toggle can only ever turn motion OFF here. Reduced motion and
       the master switch both veto, so `on()` is the single choke point. */
    function on(enabled) { return !off && !reduced && enabled !== false; }

    return {
      disableAll: off,
      reducedMotion: reduced,

      /* scroll-triggered reveals, parallax, pinned sections, counters */
      scrollAnimations: on(d.scrollAnimations !== 'false'),
      /* the follow-dot */
      customCursor: on(d.customCursor !== 'false'),
      /* Lenis. Also vetoed by reduced motion, which it previously ignored. */
      smoothScroll: on(d.smoothScroll !== 'false'),
      /* cross-document view transitions */
      viewTransitions: on(d.viewTransitions !== 'false'),

      /* Interface motion: cart drawer stagger, search palette open, bundle
         accordion, Flip re-layouts, recently-viewed, the press marquee.
         Deliberately NOT given its own merchant toggle -- none of the nine
         existing settings describes it, and inventing a tenth to control a
         drawer's 0.3s fade is more surface than it is worth. It answers to the
         master switch and to reduced motion, which is what a merchant reaching
         for "turn the motion off" actually wants. */
      ui: on(true)
    };
  }

  window.AnimSettings = flags();

  /* Keep it honest if the OS preference changes mid-session, and re-read after
     a theme-editor re-render swaps the body attributes. */
  var refresh = function () { window.AnimSettings = flags(); };
  if (mq.addEventListener) mq.addEventListener('change', refresh);
  document.addEventListener('shopify:section:load', refresh);
  document.addEventListener('DOMContentLoaded', refresh);
})();
