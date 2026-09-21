/*
 * Before/after comparison slider.
 *
 * The control is a real <input type="range">: it drags with a mouse, drags with
 * a finger, takes arrow keys, Home and End, announces a value to assistive tech,
 * and needs no code for any of that. This file only mirrors its value into the
 * --reveal custom property that clips the "after" image, and lets a press
 * anywhere on the frame jump the handle to that point.
 *
 * No motion is added: dragging IS the motion, so there is nothing for
 * AnimSettings to gate. The optional entrance nudge below is the exception and
 * is the one thing that asks.
 */
(function () {
  function setup(root) {
    if (root.dataset.compareReady === 'true') return;
    var input = root.querySelector('[data-compare-input]');
    var frame = root.querySelector('[data-compare-frame]');
    if (!input || !frame) return;
    root.dataset.compareReady = 'true';

    function paint(value) {
      root.style.setProperty('--reveal', value + '%');
    }
    paint(input.value);
    input.addEventListener('input', function () { paint(input.value); });

    /* Press anywhere on the image to move the handle there, the way every
       comparison slider a shopper has used before behaves. */
    function fromPointer(e) {
      var rect = frame.getBoundingClientRect();
      if (!rect.width) return;
      var x = (e.clientX - rect.left) / rect.width;
      var pct = Math.max(0, Math.min(100, Math.round(x * 100)));
      input.value = pct;
      paint(pct);
    }
    frame.addEventListener('pointerdown', function (e) {
      if (e.target === input) return;
      fromPointer(e);
      input.focus({ preventScroll: true });
    });

    /* One hint that the frame is draggable, once, when it first scrolls in. */
    var hint = root.dataset.compareHint === 'true';
    if (hint && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.disconnect();
          if (!(window.AnimSettings && window.AnimSettings.ui)) return;
          root.classList.add('is-hinting');
          setTimeout(function () { root.classList.remove('is-hinting'); }, 1400);
        });
      }, { threshold: 0.4 });
      io.observe(root);
    }
  }

  function init(scope) {
    var roots = (scope || document).querySelectorAll('[data-compare]');
    Array.prototype.forEach.call(roots, setup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
