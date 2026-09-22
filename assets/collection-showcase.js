/*
 * Collection showcase — the hovered name decides which picture shows.
 *
 * Every frame is already in the DOM, so activating one is a class swap and
 * never a network request. The images are still lazy, though, so the first
 * hover could land on an undecoded one: the section warms them a viewport
 * ahead, the same way the pinned rail does, and a swap costs nothing.
 *
 * Pointer and keyboard both drive it — focus activates as well as hover, so
 * tabbing through the names walks the pictures. The names are ordinary links,
 * so with this file absent the section still works: the first picture shows
 * and every name goes to its collection.
 */
(function () {
  function setup(root) {
    var names = root.querySelectorAll('[data-colshow-name]');
    var frames = root.querySelectorAll('[data-colshow-frame]');
    var ticks = root.querySelectorAll('[data-colshow-tick]');
    if (names.length < 2 || !frames.length) return;

    var current = 0;

    function activate(i) {
      if (i === current || i < 0 || i >= frames.length) return;
      current = i;
      for (var n = 0; n < frames.length; n++) frames[n].classList.toggle('is-active', n === i);
      for (var k = 0; k < names.length; k++) names[k].classList.toggle('is-active', k === i);
      for (var t = 0; t < ticks.length; t++) ticks[t].classList.toggle('is-active', t === i);
    }

    Array.prototype.forEach.call(names, function (el, i) {
      el.addEventListener('pointerenter', function () { activate(i); });
      el.addEventListener('focus', function () { activate(i); });
    });

    /* Warm the frames one viewport ahead so the first swap is instant. */
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
    var roots = (scope || document).querySelectorAll('.colshow');
    Array.prototype.forEach.call(roots, setup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
