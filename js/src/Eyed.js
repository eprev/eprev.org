const { PI, abs, min, sin, cos, atan } = Math;

function throttle(fn, context) {
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
}

const isCSSTransformSupportedOnSVG = (() => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 2 2');
  Object.assign(svg.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '2px',
    height: '2px',
  });
  svg.innerHTML = '<rect width="1" height="1" style="transform: translate(1px, 1px)"/>';
  document.body.appendChild(svg);
  const result = document.elementFromPoint(1, 1) !== svg;
  svg.parentNode.removeChild(svg);
  return result;
})();

console.log({isCSSTransformSupportedOnSVG});

const EYE_MAX_RADIUS = 24;
const MOUTH_CX = 208;
const MOUTH_CY = 436;
const MOUTH_SCALE_X = 0.25;
const MOUTH_SCALE_Y = 1.5;

export function Eyed(rootEl) {

  const eyes = [
    {el: rootEl.querySelector('[data-id=right-eye]')},
    {el: rootEl.querySelector('[data-id=left-eye]')},
  ];
  const mouthEl = rootEl.querySelector('[data-id=mouth]');

  eyes.forEach((eye) => eye.el.style.willChange = 'transform');
  Object.assign(mouthEl.style, {
    willChange: 'transform',
    transitionDuration: '.25s',
    transitionProperty: 'transform',

    // This is `center center 0`, keywords and percentages refer
    // to the canvas instead of the object itself in FF:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1209061
    // transformOrigin: `${MOUTH_CX}px ${MOUTH_CY}px 0`,
  });

  let mouthTransformTimer = null;

  const onWindowScroll = throttle(() => {
    checkVisibility();
  });
  const onMouseMove = throttle((e) => {
    eyes.forEach((eye) => {
      moveEye(eye.el, e.pageX - eye.left, eye.top - e.pageY);
    });
  });
  const onMouseOver = throttle((e) => {
    if (isMouseAt(e, 'a')) {
      openMouth();
    }
  });
  const onMouseOut = throttle((e) => {
    if (isMouseAt(e, 'a')) {
      closeMouth();
    }
  });

  // Listen for scroll and resize events and check if the 4-eyed head
  // is within the viewport
  window.addEventListener('scroll', onWindowScroll, {passive: true});
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
         top >= 0 && top < windowHeight
      || bottom > 0 && bottom <= windowHeight
      || height > windowHeight && top < 0 && bottom > windowHeight
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

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('mousemove', onMouseMove);
  }

  function pause() {
    closeMouth();

    document.removeEventListener('mouseover', onMouseOver);
    document.removeEventListener('mouseout', onMouseOut);
    document.removeEventListener('mousemove', onMouseMove);
  }

  function isMouseAt(e, selector) {
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

  function moveEye(el, x, y) {
    const angle = x
      ? (x < 0 ? PI + atan( y / x ) : atan( y / x ))
      : 0;
    const dx = min(EYE_MAX_RADIUS, abs(x)) * cos(angle);
    const dy = min(EYE_MAX_RADIUS, abs(y)) * sin(angle) * -1;

    // Edge IE doesn't apply CSS transforms on SVG elements
    // el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.setAttribute('transform',  `translate(${dx} ${dy})`);
  }

  function openMouth() {
    clearTimeout(mouthTransformTimer);
    mouthTransformTimer = setTimeout(
      () => mouthEl.style.transform = `scale(${MOUTH_SCALE_X}, ${MOUTH_SCALE_Y})`,
      // () => mouthEl.setAttribute('transform', `matrix(${MOUTH_SCALE_X}, 0, 0, ${MOUTH_SCALE_Y}, ${MOUTH_CX * (1 - MOUTH_SCALE_X)}, ${MOUTH_CY * (1 - MOUTH_SCALE_Y)})`),
      250
    );
  }

  function closeMouth() {
    clearTimeout(mouthTransformTimer);
    mouthTransformTimer = setTimeout(
      () => mouthEl.style.transform = '',
      // () => mouthEl.setAttribute('transform', ''),
      125
    );
  }

}
