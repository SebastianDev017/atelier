/*
 * Quick buy -- the product-card bag button opens the product in a modal.
 *
 * Fetches sections/quick-buy.liquid through the Section Rendering API from the
 * product's own URL, injects it into the modal shell (snippets/quick-buy-modal),
 * and lets the existing pieces run it: featured-product.js (variants, price,
 * images) boots on the `quick-buy:loaded` event, <product-form> (cart.js) adds
 * to cart and opens the drawer, and Shopify's dynamic checkout button is
 * initialised the way Shopify documents for injected buy buttons.
 *
 * Dialog behaviour: focus moves into the panel and is trapped (the theme's own
 * Atelier.trapFocus, as the cart drawer uses), Escape / backdrop / close button
 * dismiss it, focus returns to the button that opened it. When an item is
 * added, the modal steps aside for the cart drawer instead of stacking on it.
 */
(function () {
  var modal = document.querySelector('[data-quick-buy-modal]');
  if (!modal) return;
  var panel = modal.querySelector('.quick-buy__panel');
  var content = modal.querySelector('[data-quick-buy-content]');
  var closeBtn = modal.querySelector('.quick-buy__close');
  var defaultLabel = panel.getAttribute('aria-label');
  var opener = null;
  var controller = null;
  var closeTimer = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isOpen() { return !modal.hidden; }
  function reduced() { return !(window.AnimSettings && window.AnimSettings.ui); }

  function lockPage(lock) {
    document.documentElement.classList.toggle('quick-buy-open', lock);
    document.body.style.overflow = lock ? 'hidden' : '';
    if (window.lenis) { if (lock) window.lenis.stop(); else window.lenis.start(); }
  }

  function open(url, from) {
    if (!url) return;
    opener = from || document.activeElement;
    clearTimeout(closeTimer);
    modal.hidden = false;
    lockPage(true);
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    panel.setAttribute('aria-label', defaultLabel);
    panel.setAttribute('aria-busy', 'true');
    content.innerHTML = '<p class="quick-buy__status" role="status">' + esc(modal.dataset.loadingText) + '</p>';
    panel.focus();

    if (controller) controller.abort();
    controller = typeof AbortController === 'function' ? new AbortController() : null;
    var sep = url.indexOf('?') > -1 ? '&' : '?';
    fetch(url + sep + 'section_id=quick-buy', controller ? { signal: controller.signal } : {})
      .then(function (res) { if (!res.ok) throw new Error('status ' + res.status); return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var box = doc.querySelector('[data-quick-buy-product]');
        if (!box) throw new Error('no product');
        /* Only the box is inserted, and quick-buy is never part of the page's
           own render tree, so its CSS (and the gallery's) can only arrive in the
           response's <style data-section-stylesheet>. */
        if (window.Atelier && window.Atelier.adoptSectionStyles) window.Atelier.adoptSectionStyles(doc);
        content.innerHTML = '';
        content.appendChild(document.importNode(box, true));
        var injected = content.querySelector('[data-quick-buy-product]');
        document.dispatchEvent(new CustomEvent('quick-buy:loaded', { detail: { root: injected } }));
        /* Shopify's documented call for buy buttons added after page load. */
        if (window.Shopify && window.Shopify.PaymentButton && typeof window.Shopify.PaymentButton.init === 'function') {
          window.Shopify.PaymentButton.init();
        }
        var title = injected.querySelector('.quick-buy__title');
        if (title) { panel.removeAttribute('aria-label'); panel.setAttribute('aria-labelledby', title.id); }
        panel.removeAttribute('aria-busy');
        if (window.Atelier && window.Atelier.trapFocus) window.Atelier.trapFocus(panel, closeBtn);
        if (window.gsap && !reduced()) {
          window.gsap.fromTo(injected, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        }
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        panel.removeAttribute('aria-busy');
        content.innerHTML = '<p class="quick-buy__status" role="alert">' + esc(modal.dataset.errorText) +
          ' <a class="link" href="' + esc(url) + '">' + esc(modal.dataset.detailsText) + '</a></p>';
        if (window.Atelier && window.Atelier.trapFocus) window.Atelier.trapFocus(panel, closeBtn);
      });
  }

  /* restoreFocus is false when something else (the cart drawer) now owns
     focus and its own trap -- releasing the trap here would release theirs. */
  function close(restoreFocus) {
    if (!isOpen()) return;
    if (controller) { controller.abort(); controller = null; }
    modal.classList.remove('is-open');
    panel.removeAttribute('aria-labelledby');
    lockPage(false);
    if (restoreFocus !== false) {
      if (window.Atelier && window.Atelier.removeTrapFocus) window.Atelier.removeTrapFocus();
      if (opener && document.contains(opener) && opener.getClientRects().length) opener.focus();
    }
    opener = null;
    var finish = function () { modal.hidden = true; content.innerHTML = ''; };
    if (reduced()) finish();
    else closeTimer = setTimeout(finish, 250);
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-quick-buy]');
    if (trigger) { e.preventDefault(); open(trigger.getAttribute('data-quick-buy'), trigger); return; }
    if (isOpen() && e.target.closest && e.target.closest('[data-quick-buy-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { e.stopPropagation(); close(); }
  });
  /* Added to cart: cart.js already opened the drawer with its own focus trap. */
  document.addEventListener('cart:item-added', function (e) {
    if (isOpen() && e.detail && e.detail.form && modal.contains(e.detail.form)) close(false);
  });
})();
