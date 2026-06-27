/*
 * Product reviews — "was this helpful?" votes persisted in localStorage only
 * (no server). Delegated; safe to load on every page.
 */
(function () {
  var KEY = 'atelier-review-votes';
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  function markVoted(el) {
    el.classList.add('is-voted');
    el.querySelectorAll('[data-helpful]').forEach(function (b) { b.disabled = true; });
  }

  function boot() {
    var votes = read();
    document.querySelectorAll('[data-review-helpful]').forEach(function (el) {
      if (votes[el.getAttribute('data-review-helpful')]) markVoted(el);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-helpful]');
    if (!btn) return;
    var el = btn.closest('[data-review-helpful]');
    if (!el) return;
    var votes = read();
    votes[el.getAttribute('data-review-helpful')] = btn.getAttribute('data-helpful');
    write(votes);
    markVoted(el);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
