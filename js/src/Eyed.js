const EYE_RADIUS = 24;

// TODO: Move eyes only when the head is in the viewport

export class Eyed {
  constructor(el) {
    this.el = el;
    this.eyes = [
      {el: this.el.querySelector('[data-id=right-eye]')},
      {el: this.el.querySelector('[data-id=left-eye]')},
    ];
    this.eyes.forEach((o) => o.el.style.willChange = 'transform');
    this.onResize();
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener('resize', this.onResize);
    document.body.addEventListener('mousemove', this.onMouseMove);
  }
  onResize() {
    this.eyes.forEach((o) => {
      const { left, top, width, height } = o.el.getBoundingClientRect();
      o.left = left + window.pageXOffset + width / 2;
      o.top = top + window.pageYOffset + height / 2;
    });
  }
  onMouseMove(e) {
    this.eyes.forEach((o) => {
      this.moveEye(o.el, e.pageX - o.left, o.top - e.pageY);
    });
  }
  moveEye(el, x, y) {
    const angle = x < 0 ? Math.PI + Math.atan( y / x ) : Math.atan( y / x );

    const ax = Math.abs(x);
    const ay = Math.abs(y);

    const dx = Math.min(EYE_RADIUS, ax) * Math.cos(angle);
    const dy = Math.min(EYE_RADIUS, ay) * Math.sin(angle) * -1;

    // console.log({x, y, angle, dx, dy});

    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }
}
