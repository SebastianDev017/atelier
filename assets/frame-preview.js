/*
 * Frame preview — the checked option paints the frame.
 *
 * Each radio carries its own four numbers as data attributes and this file
 * copies them onto the stage as custom properties. Nothing is re-rendered and
 * the artwork is never re-fetched: a frame change is four property writes.
 *
 * The inputs are native radios inside a fieldset, so the arrow keys, the
 * labels and the announced group name are the browser's, not ours. If this
 * file never runs, the first option ships already drawn on the stage and the
 * list still reads as the framing the shop offers.
 */
(function () {
  function setup(root) {
    var stage = root.querySelector('[data-frmprev-stage]');
    var group = root.querySelector('[data-frmprev-options]');
    if (!stage || !group) return;

    var radios = group.querySelectorAll('input[type="radio"]');
    if (!radios.length) return;

    function paint(input) {
      if (!input) return;
      stage.style.setProperty('--fp-frame', input.getAttribute('data-fp-frame'));
      stage.style.setProperty('--fp-frame-w', input.getAttribute('data-fp-frame-w') + 'px');
      stage.style.setProperty('--fp-mat', input.getAttribute('data-fp-mat'));
      stage.style.setProperty('--fp-mat-w', input.getAttribute('data-fp-mat-w') + 'px');
    }

    group.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'radio') paint(e.target);
    });

    /* The theme editor can re-render a block with a different one checked. */
    paint(group.querySelector('input[type="radio"]:checked') || radios[0]);
  }

  function init(scope) {
    var roots = (scope || document).querySelectorAll('.frmprev');
    Array.prototype.forEach.call(roots, setup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
