/*
 * Local pickup availability.
 *
 * Whether the page's own variant can be collected anywhere is decided in
 * Liquid (snippets/pickup-availability.liquid). With no pickup location, the
 * element arrives hidden. This fetches
 * /variants/<id>/?section_id=pickup-availability for the store list:
 * - on first open, which keeps it off the critical path, since most shoppers
 *   never expand it;
 * - on every variant change, because another variant can be stocked
 *   elsewhere, and the answer shows or hides the whole disclosure.
 * Nothing is requested at load, and nothing on the page moves because of it.
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

    /* product.js dispatches this after a successful variant match. The new
       variant may be stocked differently -- or be collectable where the last
       one was not -- so its answer is fetched now, not on open. */
    document.addEventListener('atelier:variant:change', function (e) {
      if (!e.detail || !e.detail.variant || !self.isConnected) return;
      self.dataset.variantId = e.detail.variant.id;
      self.loadedVariant = null;
      self.load();
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
        if (!incoming) return;
        /* No pickup-enabled location for this variant anywhere: hide the
           disclosure rather than open it onto an apology. Hidden, not
           removed, so a later variant that can be collected brings it back. */
        if (!incoming.querySelector('.pickup__store')) {
          self.loadedVariant = variantId;
          if (self.details) self.details.open = false;
          self.hidden = true;
          return;
        }
        self.hidden = false;
        if (self.body) {
          self.body.innerHTML = incoming.outerHTML;
          self.loadedVariant = variantId;
          /* One store is not a list to choose from, it is an address, and the
             label says so. Anything else keeps the plural phrasing. */
          var label = self.querySelector('[data-pickup-label]');
          if (label) {
            var count = incoming.querySelectorAll('.pickup__store').length;
            var one = self.dataset.oneLocationText;
            var many = self.dataset.checkText;
            if (count === 1 && one) label.textContent = one;
            else if (many) label.textContent = many;
          }
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
