/*
 * Gift card recipient fields — show them when they are wanted, and tell
 * Shopify which clock the send date was chosen on.
 *
 * Two jobs, both small:
 *
 *   The fields stay hidden until the shopper says the card is for someone
 *   else. `hidden` rather than a class, so they are out of the tab order too
 *   and nobody tabs into an invisible email field.
 *
 *   __shopify_offset carries the shopper's UTC offset in minutes. Without it
 *   a card picked for "the 24th" is sent on the shop's 24th, which in the
 *   wrong direction is the 23rd where the recipient lives.
 *
 * With this file absent the fields are simply always visible, which is worse
 * looking and still entirely functional: the checkbox is the thing Shopify
 * reads, not the visibility.
 */
(function () {
  if (customElements.get('recipient-form')) return;

  var RecipientForm = function () { return Reflect.construct(HTMLElement, [], RecipientForm); };
  RecipientForm.prototype = Object.create(HTMLElement.prototype);
  Object.setPrototypeOf(RecipientForm, HTMLElement);

  RecipientForm.prototype.connectedCallback = function () {
    var checkbox = this.querySelector('[data-recipient-checkbox]');
    var fields = this.querySelector('[data-recipient-fields]');
    var offset = this.querySelector('[data-recipient-offset]');

    if (offset) offset.value = new Date().getTimezoneOffset().toString();

    if (!checkbox || !fields) return;

    var sync = function () {
      fields.hidden = !checkbox.checked;
      checkbox.setAttribute('aria-expanded', checkbox.checked ? 'true' : 'false');
    };

    /* A validation failure re-renders the page with the box already checked,
       so read the state rather than assuming it starts closed. */
    sync();
    checkbox.addEventListener('change', sync);

    /* If the server came back with errors, the shopper needs to see them. */
    if (this.querySelector('.recipient__errors')) {
      checkbox.checked = true;
      sync();
    }
  };

  customElements.define('recipient-form', RecipientForm);
})();
