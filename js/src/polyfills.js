const ElementPrototype = Element.prototype;
if (typeof ElementPrototype.matches !== 'function') {
  ElementPrototype.matches = ElementPrototype.msMatchesSelector;
}

if (typeof ElementPrototype.closest !== 'function') {
  ElementPrototype.closest = function (selector) {
    let element = this; // eslint-disable-line consistent-this

    while (element && element.nodeType === 1) {
      if (element.matches(selector)) {
        return element;
      }
      element = element.parentNode;
    }

    return null;
  };
}
