const { abs, min, sin, cos, atan } = Math;

const throttle = function (fn, context) {
  let running = false;
  return function throttled(...args) {
    if (running) {
      return;
    }
    running = true;
    requestAnimationFrame(() => {
      fn.apply(context, args);
      running = false;
    });
  };
};

export class Eyed {
  constructor(el) {
    // "Eyes" and "mouth" elements
    this._el = el;
    this._eyes = [
      {el: this._el.querySelector('[data-id=right-eye]')},
      {el: this._el.querySelector('[data-id=left-eye]')},
    ];
    this._mouthEl = this._el.querySelector('[data-id=mouth]');

    // Set initial styles
    this._eyes.forEach((eye) => eye.el.style.willChange = 'transform');
    Object.assign(this._mouthEl.style, {
      willChange: 'transform',
      transformOrigin: 'center',
      transitionDuration: '.25s',
      transitionProperty: 'transform',
    });

    // Re-bind event listeners
    this._onWindowScroll = throttle(this.onWindowScroll, this);
    this._onMouseMove = throttle(this.onMouseMove, this);
    this._onMouseOver = throttle(this.onMouseOver, this);
    this._onMouseOut = throttle(this.onMouseOut, this);

    this._mouthTransformTimer = null;

    // Listen for scroll and resize events and check if the 4-eyed head
    // is within the viewport
    window.addEventListener('scroll', this._onWindowScroll, {passive: true});
    window.addEventListener('resize', this._onWindowScroll);

    this._checkVisibility();
  }
  resume() {
    // Get the position of the every eye
    this._eyes.forEach((eye) => {
      const { left, top, width, height } = eye.el.getBoundingClientRect();
      eye.left = left + window.pageXOffset + width / 2;
      eye.top = top + window.pageYOffset + height / 2;
    });

    document.addEventListener('mouseover', this._onMouseOver);
    document.addEventListener('mouseout', this._onMouseOut);
    document.addEventListener('mousemove', this._onMouseMove);
  }
  pause() {
    this._closeMouth();

    document.removeEventListener('mouseover', this._onMouseOver);
    document.removeEventListener('mouseout', this._onMouseOut);
    document.removeEventListener('mousemove', this._onMouseMove);
  }
  _checkVisibility() {
    const windowHeight = window.innerHeight;
    const { top, bottom, height } = this._el.getBoundingClientRect();
    if (
         top >= 0 && top < windowHeight
      || bottom > 0 && bottom <= windowHeight
      || height > windowHeight && top < 0 && bottom > windowHeight
    ) {
        this.resume();
    } else {
        this.pause();
    }
  }
  _onWindowScroll() {
    this._checkVisibility();
  }
  _isMouseAt(e, selector) {
    const target = e.target;
    if (target.closest(selector)) {
      // Bail out if the related element is inside the target element
      let related = e.relatedTarget;
      while (related && related !== target) {
        related = related.parentNode;
      }
      return (related !== target);
    }
    return false;
  }
  _onMouseOver(e) {
    if (this._isMouseAt(e, 'a')) {
      clearTimeout(this._mouthTransformTimer);
      this._mouthTransformTimer = setTimeout(
        () => this._mouthEl.style.transform = 'scaleX(.25)',
        250
      );
    }
  }
  _onMouseOut(e) {
    if (this._isMouseAt(e, 'a')) {
      this._closeMouth();
    }
  }
  _closeMouth() {
    clearTimeout(this._mouthTransformTimer);
    this._mouthTransformTimer = setTimeout(
      () => this._mouthEl.style.transform = 'scaleX(1)',
      125
    );
  }
  _onMouseMove(e) {
    this._eyes.forEach((eye) => {
      const x = e.pageX - eye.left;
      const y = eye.top - e.pageY;

      const angle = x >= 0 ? atan( y / x ) : atan( x / y );
      const dx = min(24, abs(x)) * cos(angle);
      const dy = min(24, abs(y)) * sin(angle) * -1;

      // Edge IE doesn't apply CSS transforms on SVG elements
      // eye.el.style.transform = `translate(${dx}px, ${dy}px)`;
      eye.el.setAttribute('transform',  `translate(${dx} ${dy})`);
    });
  }
}
