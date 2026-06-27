/*
 * GSAP scroll animations — replaces the legacy IntersectionObserver system.
 * Runs after gsap-init.js (which registers ScrollTrigger + SplitText).
 * Fully gated behind prefers-reduced-motion.
 */
(function () {
  /* 1. SplitText line reveal */
  function initSplitText() {
    if (!window.SplitText) return;
    gsap.utils.toArray('[data-split], h1, h2, .section-heading').forEach(function (el) {
      if (el.dataset.splitDone || el.closest('[data-no-split]') || el.hasAttribute('data-no-split')) return;
      el.dataset.splitDone = '1';
      var split = new SplitText(el, { type: 'lines', linesClass: 'split-line' });
      /* Wrap each line in an overflow-hidden mask so the yPercent:110 start is clipped. */
      split.lines.forEach(function (line) {
        var mask = document.createElement('span');
        mask.className = 'line-mask';
        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
      });
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
  }

  /* 2. Fade up — staggered on groups via ScrollTrigger.batch (no FOUC: set hidden first) */
  function initFadeUp() {
    var targets = gsap.utils.toArray('[data-fade-up], .product-card, .section-text');
    if (!targets.length) return;
    gsap.set(targets, { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch(targets, {
      start: 'top 85%',
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true });
      }
    });
  }

  /* 3. Image reveal — clip-path wipe */
  function initImageReveal() {
    gsap.utils.toArray('[data-reveal], .hero__image, .feature__image').forEach(function (el) {
      gsap.fromTo(el,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.2,
          ease: 'expo.inOut',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
    });
  }

  /* 4. Parallax — scrub-linked vertical drift */
  function initParallax() {
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var amount = parseFloat(el.dataset.parallax) || -15;
      gsap.to(el, {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* 5. Magnetic buttons (.sidebar__link in the brief = this theme's .nav-link) */
  function initMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    gsap.utils.toArray('.btn, .nav-link').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = (e.clientX - (r.left + r.width / 2)) * 0.3;
        var my = (e.clientY - (r.top + r.height / 2)) * 0.3;
        var max = 8;
        gsap.to(el, {
          x: Math.max(-max, Math.min(max, mx)),
          y: Math.max(-max, Math.min(max, my)),
          duration: 0.3,
          ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      });
    });
  }

  /* 6. Counters — count up on enter */
  function initCounters() {
    gsap.utils.toArray('[data-counter]').forEach(function (el) {
      var target = parseFloat(el.dataset.counter) || 0;
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: function () { el.textContent = Math.round(obj.val).toLocaleString(); }
      });
    });
  }

  /* Hero entrance timeline — tag in first, then subtext / actions / trust.
     The headline reveals separately via initSplitText (data-split). */
  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.9 } });
    var tag = hero.querySelector('.hero__tag');
    var sub = hero.querySelector('.hero__subtext');
    var actions = hero.querySelector('.hero__actions');
    var trust = hero.querySelector('.hero__trust');
    if (tag) tl.from(tag, { opacity: 0, y: -10 }, 0);
    if (sub) tl.from(sub, { opacity: 0, y: 20 }, 0.45);
    if (actions) tl.from(actions, { opacity: 0, y: 20 }, 0.6);
    if (trust) tl.from(trust, { opacity: 0 }, 0.8);
  }

  /* Brand statement — pinned, scrubbed word-by-word reveal (opacity 0.1 -> 1). */
  function initBrandStatement() {
    if (window.Shopify && window.Shopify.designMode) return;
    if (!window.SplitText) return;
    gsap.utils.toArray('[data-brand-statement]').forEach(function (section) {
      var heading = section.querySelector('.brand-statement__heading');
      if (!heading) return;
      var split = new SplitText(heading, { type: 'words', wordsClass: 'bs-word' });
      gsap.set(split.words, { opacity: 0.1 });
      var tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: '+=100%', pin: true, scrub: 1 }
      });
      tl.to(split.words, { opacity: 1, stagger: 0.1, ease: 'none' });
      var sub = section.querySelector('.brand-statement__sub');
      if (sub) { gsap.set(sub, { opacity: 0 }); tl.to(sub, { opacity: 1, duration: 0.3 }); }
    });
  }

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    initHero();
    initBrandStatement();
    initSplitText();
    initFadeUp();
    initImageReveal();
    initParallax();
    initMagneticButtons();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
