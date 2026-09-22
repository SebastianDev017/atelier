/*
 * Local pickup availability.
 *
 * variant.store_availabilities is only populated on a variant route, so the list
 * cannot be rendered from the product page itself. This fetches
 * /variants/<id>/?section_id=pickup-availability on demand and swaps in the
 * result. Fetching on first open rather than on load keeps it off the critical
 * path -- most shoppers never expand it.
 *
 * One exception to "on demand": a shop with no pickup-enabled location at all
 * would otherwise offer a disclosure that opens onto nothing. Because the
 * answer is only knowable from the variant route, the element probes once when
 * it comes near the viewport and removes itself if the answer is none. The
 * probe's result is kept, so opening it afterwards costs no second request.
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

    /* Ask once, near the viewport: a shop with nowhere to collect from should
       not be offered a place to collect from. */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries.some(function (en) { return en.isIntersecting; })) return;
        io.disconnect();
        self.load();
      }, { rootMargin: '200px 0px' });
      io.observe(this);
    }

    /* product.js dispatches this after a successful variant match. */
    document.addEventListener('atelier:variant:change', function (e) {
      if (!e.detail || !e.detail.variant || !self.isConnected) return;
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
        if (!incoming) return;
        /* No pickup-enabled location for this variant anywhere: take the
           disclosure off the page rather than open it onto an apology. */
        if (!incoming.querySelector('.pickup__store')) {
          self.remove();
          return;
        }
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
