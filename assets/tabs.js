/*
 * Tabs — one panel visible at a time, no page reload.
 *
 * ARIA tab pattern: roving tabindex (only the selected tab is tabbable, arrows
 * move between them), aria-selected on the tab, aria-controls/aria-labelledby
 * tying tab and panel together. Panels are hidden with [hidden] rather than a
 * class, so assistive tech and find-in-page agree with what is painted.
 *
 * The crossfade asks AnimSettings at the moment of use (never cached: the
 * editor can flip the master switch between renders). With motion off the
 * panel simply appears, which is also what a reduced-motion visitor gets.
 */
(function () {
  function motionOn() {
    return !!(window.AnimSettings && window.AnimSettings.ui);
  }

  function setup(root) {
    if (root.dataset.tabsReady === 'true') return;
    var list = root.querySelector('[data-tabs-list]');
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    root.dataset.tabsReady = 'true';

    function panelOf(tab) {
      var id = tab.getAttribute('aria-controls');
      return id ? root.querySelector('#' + CSS.escape(id)) : null;
    }

    function select(tab, moveFocus) {
      tabs.forEach(function (t) {
        var current = t === tab;
        t.setAttribute('aria-selected', current ? 'true' : 'false');
        t.tabIndex = current ? 0 : -1;
        var panel = panelOf(t);
        if (!panel) return;
        if (current) {
          panel.hidden = false;
          if (motionOn()) {
            panel.classList.remove('is-entered');
            /* next frame, so the browser paints the start state first */
            requestAnimationFrame(function () { panel.classList.add('is-entered'); });
          } else {
            panel.classList.add('is-entered');
          }
        } else {
          panel.hidden = true;
          panel.classList.remove('is-entered');
        }
      });
      if (moveFocus) tab.focus();
      keepInStrip(tab);
    }

    /* A long tab strip scrolls sideways on phones: keep the active tab in view
       by scrolling the strip itself, and only when it overflows. Never
       scrollIntoView: it scrolls every scrollable ancestor, the page included,
       so selecting the initial tab at load dragged the page down to any tabs
       section below the fold, with nobody touching it (Maison home up to 357px,
       Annex collection up to 2036px, Annex product page up to 1324px). */
    function keepInStrip(tab) {
      if (list.scrollWidth <= list.clientWidth) return;
      var box = list.getBoundingClientRect();
      var r = tab.getBoundingClientRect();
      var delta = r.left < box.left ? r.left - box.left : (r.right > box.right ? r.right - box.right : 0);
      if (!delta) return;
      if (list.scrollBy) list.scrollBy({ left: delta, behavior: motionOn() ? 'smooth' : 'auto' });
      else list.scrollLeft += delta;
    }

    list.addEventListener('click', function (e) {
      var tab = e.target.closest && e.target.closest('[role="tab"]');
      if (tab && tabs.indexOf(tab) > -1) { e.preventDefault(); select(tab, false); }
    });

    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      select(next, true);
    });

    var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    select(initial, false);
  }

  function init(scope) {
    var roots = (scope || document).querySelectorAll('[data-tabs]');
    Array.prototype.forEach.call(roots, setup);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();

  /* Theme editor: a re-rendered section arrives with a fresh DOM. */
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
  document.addEventListener('shopify:block:select', function (e) {
    var tab = e.target.querySelector ? e.target.querySelector('[role="tab"]') : null;
    var root = e.target.closest ? e.target.closest('[data-tabs]') : null;
    if (root && tab) tab.click();
  });
})();
