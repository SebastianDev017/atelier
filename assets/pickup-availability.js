/*
 * Local pickup availability.
 *
 * variant.store_availabilities is only populated on a variant route, so the list
 * cannot be rendered from the product page itself. This fetches
 * /variants/<id>/?section_id=pickup-availability on demand and swaps in the
 * result. Fetching on first open rather than on load keeps it off the critical
 * path -- most shoppers never expand it.
 */
(function () {
  if (customElements.get('pickup-availability')) return;

  var PickupAvailability = function () {
    return Reflect.construct(HTMLElement, [], PickupAvailability);
  };
  PickupAvailability.prototype = Object.create(HTMLElement.prototype);
  Object.setPrototypeOf(PickupAvailability, HTMLElement);

  PickupAvailability.prototype.connectedCallback = function () {
    var self = this;
    this.details = this.querySelector('[data-pickup-details]');
    this.body = this.querySelector('[data-pickup-body]');
    this.loadedVariant = null;
    this.requestId = 0;

    if (this.details) {
      this.details.addEventListener('toggle', function () {
        if (self.details.open) self.load();
      });
    }

    /* product.js dispatches this after a successful variant match. */
    document.addEventListener('atelier:variant:change', function (e) {
      if (!e.detail || !e.detail.variant) return;
      self.dataset.variantId = e.detail.variant.id;
      /* Drop the cached render: the new variant may stock differently. */
      self.loadedVariant = null;
      if (self.details && self.details.open) self.load();
    });
  };

  PickupAvailability.prototype.load = function () {
    var self = this;
    var variantId = this.dataset.variantId;
    if (!variantId || this.loadedVariant === variantId) return;

    var reqId = ++this.requestId;
    var url = this.dataset.baseUrl + '/variants/' + variantId + '/?section_id=pickup-availability';

    fetch(url)
      .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
      .then(function (text) {
        /* Discard a response that a later variant change has superseded. */
        if (reqId !== self.requestId) return;
        var doc = new DOMParser().parseFromString(text, 'text/html');
        var incoming = doc.querySelector('[data-pickup-list]');
        if (incoming && self.body) {
          self.body.innerHTML = incoming.outerHTML;
          self.loadedVariant = variantId;
        }
      })
      .catch(function () {
        if (reqId !== self.requestId || !self.body) return;
        /* Leave the disclosure usable rather than stuck on "Loading". */
        var msg = self.body.querySelector('[data-pickup-loading]');
        if (msg) msg.textContent = self.dataset.errorText || '';
      });
  };

  customElements.define('pickup-availability', PickupAvailability);
})();
