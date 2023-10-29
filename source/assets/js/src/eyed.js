import { throttle } from './utils.js';

const { PI, abs, min, sin, cos, atan } = Math;

const EYE_MAX_RADIUS = 24;
const MOUTH_CX = 208;
const MOUTH_CY = 436;
const MOUTH_SCALE_X = 0.25;
const MOUTH_SCALE_Y = 1.5;

/** @param {HTMLElement} rootEl */
export default function eyed(rootEl) {
  const eyes = [
    {
      el: /** @type {HTMLElement} */ (
        rootEl.querySelector('[data-id=right-eye]')
      ),
    },
    {
      el: /** @type {HTMLElement} */ (
        rootEl.querySelector('[data-id=left-eye]')
      ),
    },
  ];
  const mouthEl = /** @type {HTMLElement} */ (
    rootEl.querySelector('[data-id=mouth]')
  );

  eyes.forEach((eye) => (eye.el.style.willChange = 'transform'));
  Object.assign(mouthEl.style, {
    willChange: 'transform',
    transitionDuration: '.25s',
    transitionProperty: 'transform',
  });

  let mouthTransformTimer = null;
  let isMouthOpen = false;

  const onWindowScroll = throttle(() => {
    checkVisibility();
  });
  const onMouseMove = throttle((e) => {
    eyes.forEach((eye) => {
      moveEye(eye.el, e.pageX - eye.left, eye.top - e.pageY);
    });
    if (e.target.closest('a')) {
      openMouth();
    } else {
      closeMouth();
    }
  });
  const onTouchStart = throttle((e) => {
    const touch = e.touches.item(0);
    eyes.forEach((eye) => {
      moveEye(eye.el, touch.pageX - eye.left, eye.top - touch.pageY);
    });
    openMouth(0);
  });
  const onTouchEnd = throttle(() => {
    closeMouth(0);
  });

  // Listen for scroll and resize events and check if the 4-eyed head
  // is within the viewport
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  window.addEventListener('resize', onWindowScroll);

  checkVisibility();

  // Return public interface
  return {
    resume,
    pause,
  };

  function checkVisibility() {
    const windowHeight = window.innerHeight;
    const { top, bottom, height } = rootEl.getBoundingClientRect();
    if (
      (top >= 0 && top < windowHeight) ||
      (bottom > 0 && bottom <= windowHeight) ||
      (height > windowHeight && top < 0 && bottom > windowHeight)
    ) {
      resume();
    } else {
      pause();
    }
  }

  function resume() {
    // Get the position of the every eye
    eyes.forEach((eye) => {
      const { left, top, width, height } = eye.el.getBoundingClientRect();
      eye.left = left + window.pageXOffset + width / 2;
      eye.top = top + window.pageYOffset + height / 2;
    });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
  }

  function pause() {
    closeMouth();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
  }

  /** @type {(el: HTMLElement, dx: number, dy: number) => void} */
  function translate(el, dx, dy) {
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  /** @type {(el: HTMLElement, sx?: number, sy?: number, cx?: number, cy?: number) => void} */
  function scale(el, sx = 1, sy = 1, cx = 0, cy = 0) {
    // We could use `scale()` function and `transform-origin: center`, but:
    // 1) the later doesn't work properly in FF: keywords and percentages refer
    //    to the canvas instead of the object itself (see
    //    https://bugzilla.mozilla.org/show_bug.cgi?id=1209061)
    // 2) there's no such thing as `transform-origin` in SVG.
    // Hence we are gonna use `matrix` function instead.
    const transform = `matrix(${sx}, 0, 0, ${sy}, ${cx * (1 - sx)}, ${
      cy * (1 - sy)
    })`;
    mouthEl.style.transform = transform;
  }

  /** @type {(el: HTMLElement, x: number, y: number) => void} */
  function moveEye(el, x, y) {
    const angle = x ? (x < 0 ? PI + atan(y / x) : atan(y / x)) : 0;
    const dx = min(EYE_MAX_RADIUS, abs(x)) * cos(angle);
    const dy = min(EYE_MAX_RADIUS, abs(y)) * sin(angle) * -1;
    translate(el, dx, dy);
  }

  function openMouth(delay = 250) {
    if (!isMouthOpen) {
      isMouthOpen = true;
      clearTimeout(mouthTransformTimer);
      mouthTransformTimer = setTimeout(
        () => scale(mouthEl, MOUTH_SCALE_X, MOUTH_SCALE_Y, MOUTH_CX, MOUTH_CY),
        delay,
      );
    }
  }

  function closeMouth(delay = 125) {
    if (isMouthOpen) {
      isMouthOpen = false;
      clearTimeout(mouthTransformTimer);
      mouthTransformTimer = setTimeout(() => scale(mouthEl), delay);
    }
  }
}
