const EYE_RADIUS = 24;

// TODO: Move eyes only when the head is in the viewport

// import { observer } from './ViewObserver';

const { PI, abs, min, sin, cos, atan } = Math;

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

    this.onResize();
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.mouseEventTimer = null;
    window.addEventListener('resize', this.onResize);
    document.body.addEventListener('mousemove', this.onMouseMove);
    document.body.addEventListener('mouseover', this.onMouseOver);
    document.body.addEventListener('mouseout', this.onMouseOut);
    // observer.watchFor(this.el);
    // this.el.addEventListener('viewenter', () => {
    // });
    // this.el.addEventListener('viewleave', () => {
    // });
  }
  onResize() {
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
      clearTimeout(this.mouseEventTimer);
      this.mouseEventTimer = setTimeout(() => this.mouth.style.transform = 'scaleX(1)', 250);
    }
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

    const dx = min(EYE_RADIUS, ax) * cos(angle);
    const dy = min(EYE_RADIUS, ay) * sin(angle) * -1;

    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }
}
