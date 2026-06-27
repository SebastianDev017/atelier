/*
 * <collection-recommendations> — tops up the same-collection grid with Shopify's
 * native product recommendations when the collection has too few products. Fetches
 * the section in recommendations mode (full server-rendered product cards, so
 * prices are correct), de-dupes by handle, and appends up to the wanted count.
 * Hides the section if it ends up empty.
 */
(function () {
  function CollectionRecommendations() { return Reflect.construct(HTMLElement, [], CollectionRecommendations); }
  CollectionRecommendations.prototype = Object.create(HTMLElement.prototype);
  CollectionRecommendations.prototype.constructor = CollectionRecommendations;

  CollectionRecommendations.prototype.connectedCallback = function () {
    this.grid = this.querySelector('[data-rec-grid]');
    if (!this.grid) return;
    var want = parseInt(this.dataset.want, 10) || 4;
    var url = this.dataset.fallbackUrl;
    if (this.grid.children.length >= want || !url) { this.finish(); return; }

    var self = this;
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { self.observer.disconnect(); self.fill(want, url); }
      }, { rootMargin: '0px 0px 400px 0px' });
      this.observer.observe(this);
    } else {
      this.fill(want, url);
    }
  };

  CollectionRecommendations.prototype.disconnectedCallback = function () {
    if (this.observer) this.observer.disconnect();
  };

  CollectionRecommendations.prototype.fill = function (want, url) {
    var self = this;
    fetch(url)
      .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/html');
        var seen = {};
        self.grid.querySelectorAll('[data-rec-card]').forEach(function (c) { seen[c.getAttribute('data-rec-card')] = true; });
        var incoming = doc.querySelectorAll('[data-rec-card]');
        Array.prototype.forEach.call(incoming, function (card) {
          if (self.grid.children.length >= want) return;
          var handle = card.getAttribute('data-rec-card');
          if (seen[handle]) return;
          seen[handle] = true;
          self.grid.appendChild(document.importNode(card, true));
        });
      })
      .catch(function () {})
      .finally(function () { self.finish(); });
  };

  CollectionRecommendations.prototype.finish = function () {
    if (this.grid && this.grid.children.length === 0) {
      var host = this.closest('.shopify-section') || this;
      host.hidden = true;
    }
  };

  if (!customElements.get('collection-recommendations')) {
    customElements.define('collection-recommendations', CollectionRecommendations);
  }
})();
