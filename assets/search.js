/* ============================================================
   ATELIER — search.js
   <predictive-search> : live suggestions via Section Rendering of
   sections/predictive-results.liquid, with combobox keyboard nav.
   ============================================================ */
(function () {
  'use strict';

  var A = window.Atelier || {};

  var PredictiveSearch = (function () {
    function PredictiveSearch() { return Reflect.construct(HTMLElement, [], PredictiveSearch); }
    PredictiveSearch.prototype = Object.create(HTMLElement.prototype);
    PredictiveSearch.prototype.constructor = PredictiveSearch;

    PredictiveSearch.prototype.connectedCallback = function () {
      this.input = this.querySelector('[data-search-input]');
      this.results = this.querySelector('[data-search-results]');
      this.reset = this.querySelector('[data-search-reset]');
      this.searchUrl = this.dataset.searchUrl || '/search/suggest';
      this.options = [];
      this.activeIndex = -1;

      this.onInput = (A.debounce ? A.debounce(this.search.bind(this), 250) : this.search.bind(this));
      this.onKeydown = this.onKeydown.bind(this);
      this.onReset = this.onReset.bind(this);
      this.onDocClick = this.onDocClick.bind(this);

      if (this.input) {
        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('keydown', this.onKeydown);
      }
      if (this.reset) this.reset.addEventListener('click', this.onReset);
      document.addEventListener('click', this.onDocClick);
    };

    PredictiveSearch.prototype.disconnectedCallback = function () {
      if (this.input) {
        this.input.removeEventListener('input', this.onInput);
        this.input.removeEventListener('keydown', this.onKeydown);
      }
      if (this.reset) this.reset.removeEventListener('click', this.onReset);
      document.removeEventListener('click', this.onDocClick);
    };

    PredictiveSearch.prototype.search = function () {
      var q = this.input.value.trim();
      if (this.reset) this.reset.hidden = q.length === 0;
      if (q.length < 2) { this.closeResults(); return; }

      var self = this;
      var url = this.searchUrl + '?q=' + encodeURIComponent(q) +
        '&section_id=predictive-results&resources[type]=product,page,article&resources[limit]=6';
      fetch(url)
        .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
        .then(function (text) {
          var doc = new DOMParser().parseFromString(text, 'text/html');
          var incoming = doc.querySelector('[data-predictive-results]');
          self.results.innerHTML = incoming ? incoming.innerHTML : '';
          self.openResults();
        })
        .catch(function () {});
    };

    PredictiveSearch.prototype.openResults = function () {
      this.results.hidden = false;
      this.input.setAttribute('aria-expanded', 'true');
      this.options = Array.prototype.slice.call(this.results.querySelectorAll('[role="option"]'));
      this.activeIndex = -1;
    };

    PredictiveSearch.prototype.closeResults = function () {
      this.results.hidden = true;
      this.results.innerHTML = '';
      this.input.setAttribute('aria-expanded', 'false');
      this.options = [];
      this.activeIndex = -1;
    };

    PredictiveSearch.prototype.onReset = function () {
      this.input.value = '';
      if (this.reset) this.reset.hidden = true;
      this.closeResults();
      this.input.focus();
    };

    PredictiveSearch.prototype.onDocClick = function (event) {
      if (!this.contains(event.target)) this.closeResults();
    };

    PredictiveSearch.prototype.onKeydown = function (event) {
      if (this.results.hidden) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); this.move(1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); this.move(-1); }
      else if (event.key === 'Escape') { this.closeResults(); }
      else if (event.key === 'Enter' && this.activeIndex >= 0) {
        var current = this.options[this.activeIndex];
        var link = current && current.querySelector('a');
        if (link) { event.preventDefault(); window.location.href = link.href; }
      }
    };

    PredictiveSearch.prototype.move = function (dir) {
      if (!this.options.length) return;
      if (this.activeIndex >= 0 && this.options[this.activeIndex]) {
        this.options[this.activeIndex].setAttribute('aria-selected', 'false');
      }
      this.activeIndex = (this.activeIndex + dir + this.options.length) % this.options.length;
      var current = this.options[this.activeIndex];
      current.setAttribute('aria-selected', 'true');
      if (current.id === '') current.id = 'predictive-option-' + this.activeIndex;
      this.input.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    };

    return PredictiveSearch;
  })();

  if (!customElements.get('predictive-search')) {
    customElements.define('predictive-search', PredictiveSearch);
  }
})();
