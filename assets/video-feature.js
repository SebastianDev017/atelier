/*
 * Video feature — the outside player is built on the first click, never before.
 *
 * A YouTube or Vimeo embed is a third-party document: it costs requests, it
 * runs scripts, and on a page nobody watches it buys nothing. So the markup
 * ships a poster and a <template>, and this file moves the template's content
 * into the frame the first time someone asks for it.
 *
 * Focus follows the swap, because the control that was just pressed is about
 * to be removed from the page and focus must not be dropped on the body.
 *
 * A Shopify-hosted video needs none of this: it is a real <video> with the
 * browser's own controls and this file leaves it alone.
 */
(function () {
  function setup(root) {
    var button = root.querySelector('[data-vidfeat-play]');
    var tpl = root.querySelector('[data-vidfeat-embed]');
    if (!button || !tpl || !('content' in tpl)) return;

    button.addEventListener('click', function () {
      var frag = tpl.content.cloneNode(true);
      var frame = document.createElement('div');
      frame.appendChild(frag);
      var player = frame.firstElementChild;
      if (!player) return;

      root.appendChild(player);
      button.remove();
      tpl.remove();

      /* The pressed control is gone; hand focus to what replaced it. */
      player.setAttribute('tabindex', '-1');
      try { player.focus({ preventScroll: true }); } catch (e) { player.focus(); }
    });
  }

  function init(scope) {
    var roots = (scope || document).querySelectorAll('[data-vidfeat]');
    Array.prototype.forEach.call(roots, setup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
