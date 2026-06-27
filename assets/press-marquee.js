/*
 * Press marquee — seamless dual-direction scroll. Each track renders its items
 * twice, so animating xPercent by exactly one set width loops seamlessly.
 * Pauses on hover. Skipped entirely under prefers-reduced-motion.
 */
(function () {
  function init() {
    if (!window.gsap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('[data-press-track]').forEach(function (track) {
      var goRight = track.dataset.direction === 'right';
      var speed = parseFloat(track.dataset.speed) || 40;
      var from = goRight ? -50 : 0;
      var to = goRight ? 0 : -50;

      gsap.set(track, { xPercent: from });
      var tween = gsap.to(track, { xPercent: to, duration: speed, ease: 'none', repeat: -1 });

      var hoverTarget = track.closest('[data-press-marquee]') || track;
      hoverTarget.addEventListener('mouseenter', function () { tween.pause(); });
      hoverTarget.addEventListener('mouseleave', function () { tween.play(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
