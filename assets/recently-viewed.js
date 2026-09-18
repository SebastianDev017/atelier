/*
 * Recently-viewed pill. Records the current product (PDP) into localStorage
 * (max 6, most-recent-first, de-duped) and renders a floating pill on every page
 * once 2+ distinct products have been viewed. Pure progressive enhancement.
 */
(function () {
  var KEY = 'atelier-recently-viewed';
  var MAX = 6;

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  /* AnimSettings.ui folds in prefers-reduced-motion AND anim_disable_all. */
  function reduced() { return !(window.AnimSettings && window.AnimSettings.ui); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 1. Record the current product (PDP only). */
  var currentHandle = null;
  var cur = document.querySelector('[data-rv-current]');
  if (cur) {
    try {
      var p = JSON.parse(cur.textContent);
      if (p && p.handle) {
        currentHandle = p.handle;
        var next = read().filter(function (x) { return x.handle !== p.handle; });
        next.unshift(p);
        write(next.slice(0, MAX));
      }
    } catch (e) {}
  }

  /* 2. Render the pill (any page) — only after 2+ products viewed. */
  var pill = document.querySelector('[data-recently-viewed]');
  if (!pill) return;
  var all = read();
  var items = all.filter(function (x) { return x.handle !== currentHandle; });
  if (all.length < 2 || !items.length) return;

  var panel = pill.querySelector('[data-rv-panel]');
  var toggle = pill.querySelector('[data-rv-toggle]');
  var colorsLabel = pill.getAttribute('data-colors-label') || '';
  /* Swatch fills come from the product page as either a colour value or a
     url(...) for an image swatch; anything else is dropped rather than
     written into a style attribute. */
  function fillStyle(f) {
    f = String(f || '');
    if (/^url\(https?:\/\/[^)\s"']+\)$/.test(f) || /^url\(\/\/[^)\s"']+\)$/.test(f)) return 'background-image:' + f;
    if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i.test(f)) return 'background-color:' + f;
    return '';
  }
  function swatches(x) {
    if (!x.swatches || !x.swatches.length) return '';
    return '<div class="product-card__swatches" data-swatch-group role="group" aria-label="' + esc(colorsLabel) + '">' +
      x.swatches.map(function (s) {
        return '<a class="product-card__swatch" href="' + esc(s.url) + '" aria-label="' + esc((x.option ? x.option + ': ' : '') + s.name) + '"' +
          (s.image ? ' data-swatch-image="' + esc(s.image) + '"' : '') + '>' +
          '<span class="swatch" style="' + esc(fillStyle(s.fill)) + '"></span></a>';
      }).join('') + '</div>';
  }
  /* An item is a div: its swatches are links of their own, and links cannot
     nest. The image and the title both lead to the product (the image link is
     a duplicate for pointer users, so it is kept out of the tab order). */
  panel.innerHTML = items.map(function (x) {
    return '<div class="rv-item" data-swatch-root>' +
      '<a class="rv-item__media" href="' + esc(x.url) + '" tabindex="-1" aria-hidden="true">' +
      (x.image ? '<img class="rv-item__img" data-swatch-target src="' + esc(x.image) + '" alt="" width="48" height="60" loading="lazy">' : '<span class="rv-item__img"></span>') +
      '</a>' +
      '<span class="rv-item__info"><a class="rv-item__title" href="' + esc(x.url) + '">' + esc(x.title) + '</a>' +
      (x.price ? '<span class="rv-item__price">' + esc(x.price) + '</span>' : '') +
      swatches(x) +
      '</span></div>';
  }).join('');

  pill.hidden = false;
  if (window.gsap && !reduced()) gsap.from(pill, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out', delay: 0.6 });

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && window.gsap && !reduced()) gsap.from(panel.children, { opacity: 0, x: 10, stagger: 0.05, duration: 0.3, ease: 'power2.out' });
  }

  toggle.addEventListener('click', function (e) { e.stopPropagation(); setOpen(panel.hidden); });
  document.addEventListener('click', function (e) { if (!pill.contains(e.target) && !panel.hidden) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });
})();
