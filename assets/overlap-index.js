/*
 * Overlap index — the name you point at is lifted out of the pile.
 *
 * Every picture and every note is already in the DOM, so activating one is a
 * class swap and never a network request. The pictures are lazy, though, so
 * the section warms them a viewport ahead the same way the pinned rail and
 * the collection showcase do, and the first swap costs nothing.
 *
 * Pointer and keyboard both drive it: focus activates as well as hover, so
 * tabbing down the index walks the pictures. Notes carry `hidden` rather
 * than a class alone, so a screen reader is never offered five descriptions
 * at once, and the link inside an inactive note stays out of the tab order.
 *
 * With this file absent the first entry is active and every name is still an
 * ordinary link to wherever the merchant pointed it.
 */
(function () {
  function setup(root) {
    var names = root.querySelectorAll('[data-ovidx-name]');
    var items = root.querySelectorAll('[data-ovidx-item]');
    var frames = root.querySelectorAll('[data-ovidx-frame]');
    var notes = root.querySelectorAll('[data-ovidx-note]');
    if (names.length < 2 || !frames.length) return;

    var current = 0;

    function activate(i) {
      if (i === current || i < 0 || i >= frames.length) return;
      current = i;
      for (var f = 0; f < frames.length; f++) frames[f].classList.toggle('is-active', f === i);
      for (var t = 0; t < items.length; t++) items[t].classList.toggle('is-active', t === i);
      for (var n = 0; n < notes.length; n++) {
        var on = n === i;
        notes[n].classList.toggle('is-active', on);
        notes[n].hidden = !on;
        var cta = notes[n].querySelector('.ovidx__note-cta');
        if (cta) cta.tabIndex = on ? 0 : -1;
      }
    }

    Array.prototype.forEach.call(names, function (el, i) {
      el.addEventListener('pointerenter', function () { activate(i); });
      el.addEventListener('focus', function () { activate(i); });
    });

    /* The note that ships active gets its link put back in the tab order. */
    var first = notes[0] && notes[0].querySelector('.ovidx__note-cta');
    if (first) first.tabIndex = 0;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        io.disconnect();
        var imgs = root.querySelectorAll('img[loading="lazy"]');
        Array.prototype.forEach.call(imgs, function (img) {
          img.loading = 'eager';
          if (img.decode) img.decode().catch(function () {});
        });
      }, { rootMargin: '100% 0px' });
      io.observe(root);
    }
  }

  function init(scope) {
    var roots = (scope || document).querySelectorAll('.ovidx');
    Array.prototype.forEach.call(roots, setup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
