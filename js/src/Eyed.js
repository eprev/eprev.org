const { PI, abs, min, sin, cos, atan } = Math;

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
    this.el = el;
    this.eyes = [
      {el: this.el.querySelector('[data-id=right-eye]')},
      {el: this.el.querySelector('[data-id=left-eye]')},
    ];
    this.mouth = this.el.querySelector('[data-id=mouth]');

    this.eyes.forEach((o) => o.el.style.willChange = 'transform');
    Object.assign(this.mouth.style, {
      willChange: 'transform',
      transformOrigin: 'center',
      transitionDuration: '.25s',
      transitionProperty: 'transform',
    });

    this.checkVisibility = throttle(this.checkVisibility, this);
    this.updateEyesPosition = throttle(this.updateEyesPosition, this);
    this.onMouseMove = throttle(this.onMouseMove, this);
    this.onMouseOver = throttle(this.onMouseOver, this);
    this.onMouseOut = throttle(this.onMouseOut, this);

    this.updateEyesPosition();

    window.addEventListener('scroll', this.checkVisibility, {passive: true});
    window.addEventListener('resize', this.checkVisibility);

    this.addListeners();
  }
  addListeners() {
    window.addEventListener('resize', this.updateEyesPosition);
    document.addEventListener('mouseover', this.onMouseOver);
    document.addEventListener('mouseout', this.onMouseOut);
    document.addEventListener('mousemove', this.onMouseMove);
  }
  removeListeners() {
    window.removeEventListener('resize', this.updateEyesPosition);
    document.removeEventListener('mouseover', this.onMouseOver);
    document.removeEventListener('mouseout', this.onMouseOut);
    document.removeEventListener('mousemove', this.onMouseMove);
  }
  checkVisibility() {
    const windowHeight = window.innerHeight;
    const { top, bottom, height } = this.el.getBoundingClientRect();
    if (
         top >= 0 && top < windowHeight
      || bottom > 0 && bottom <= windowHeight
      || top < 0 && bottom > windowHeight && height > windowHeight
    ) {
        this.addListeners();
    } else {
        this.resetMouth();
        this.removeListeners();
    }
  }
  updateEyesPosition() {
    this.eyes.forEach((o) => {
      const { left, top, width, height } = o.el.getBoundingClientRect();
      o.left = left + window.pageXOffset + width / 2;
      o.top = top + window.pageYOffset + height / 2;
    });
  }
  isMouseAt(e, selector) {
    const target = e.target;
    if (target.closest(selector)) {
      let relatedTarget = e.relatedTarget;
      while (relatedTarget && relatedTarget !== target) {
        relatedTarget = relatedTarget.parentNode;
      }
      return (relatedTarget !== target);
    }
    return false;
  }
  onMouseOver(e) {
    if (this.isMouseAt(e, 'a')) {
      clearTimeout(this.mouseEventTimer);
      this.mouseEventTimer = setTimeout(() => this.mouth.style.transform = 'scaleX(.25)', 250);
    }
  }
  onMouseOut(e) {
    if (this.isMouseAt(e, 'a')) {
      this.resetMouth();
    }
  }
  resetMouth() {
    clearTimeout(this.mouseEventTimer);
    this.mouseEventTimer = setTimeout(() => this.mouth.style.transform = 'scaleX(1)', 125);
  }
  onMouseMove(e) {
    this.eyes.forEach((o) => {
      this.moveEye(o.el, e.pageX - o.left, o.top - e.pageY);
    });
  }
  moveEye(el, x, y) {
    const angle = x < 0 ? PI + atan( y / x ) : atan( y / x );

    const ax = abs(x);
    const ay = abs(y);

    const dx = min(24, ax) * cos(angle);
    const dy = min(24, ay) * sin(angle) * -1;

    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }
}
