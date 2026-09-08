/*
 * Renders the gift card QR from gift_card.qr_identifier.
 *
 * Separate from the template so both this and qrcode.min.js can carry `defer`
 * (an inline script cannot be deferred, and without defer the library tag is
 * parser-blocking). Deferred scripts execute in document order, so QRCode is
 * always defined by the time this runs.
 */
(function () {
  function render() {
    var el = document.getElementById('GiftCardQr');
    if (!el || typeof QRCode === 'undefined') return;
    var value = el.getAttribute('data-qr-identifier');
    if (!value) return;
    /* 160px square. The Theme Store minimum is 120x120; the extra margin keeps
       it scannable on a low-DPI screen. */
    new QRCode(el, {
      text: value,
      width: 160,
      height: 160,
      correctLevel: QRCode.CorrectLevel.M
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
