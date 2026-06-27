/*
 * Bundle accordion toggle (snippets/bundle.liquid). Reveals the hidden bundle
 * items with a GSAP height animation (measure -> animate -> set auto). Delegated,
 * so it works for every bundle on the page. Reduced-motion / no-GSAP fall back to
 * an instant open/close. (Add-to-cart for the [+] lives in cart.js.)
 */
(function () {
  function reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-bundle-toggle]');
    if (!btn) return;
    var accordion = btn.closest('.bundle__accordion');
    var hidden = accordion && accordion.querySelector('[data-bundle-hidden]');
    if (!hidden) return;

    var textEl = btn.querySelector('[data-bundle-toggle-text]') || btn;
    var willOpen = btn.dataset.open !== 'true';

    btn.dataset.open = willOpen ? 'true' : 'false';
    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    hidden.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    textEl.textContent = (willOpen ? '▲ ' + btn.dataset.labelClose : '▼ ' + btn.dataset.labelOpen);

    if (window.gsap && !reduced()) {
      if (willOpen) {
        gsap.fromTo(hidden, { height: 0 }, {
          height: hidden.scrollHeight, duration: 0.4, ease: 'expo.out',
          onComplete: function () { hidden.style.height = 'auto'; }
        });
      } else {
        gsap.fromTo(hidden, { height: hidden.scrollHeight }, { height: 0, duration: 0.3, ease: 'expo.in' });
      }
    } else {
      hidden.style.height = willOpen ? 'auto' : '0px';
    }
  });
})();
