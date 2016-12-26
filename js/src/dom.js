const ElementPrototype = Element.prototype;
if (typeof ElementPrototype.matches !== 'function') {
    ElementPrototype.matches = ElementPrototype.msMatchesSelector;
}

if (typeof ElementPrototype.closest !== 'function') {
    ElementPrototype.closest = function closest(selector) {
        var element = this;

        while (element && element.nodeType === 1) {
            if (element.matches(selector)) {
                return element;
            }
            element = element.parentNode;
        }

        return null;
    };
}
