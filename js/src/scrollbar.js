// TODO: scroll on select

import { throttle } from './utils';

const { min, max, abs, floor } = Math;

const MIN_SCROLLBAR_WIDTH = 50;

const cache = new WeakMap();

function scrollable(targetEl) {

  if (cache.has(targetEl)) {
    return cache.get(targetEl);
  }

  let clientWidth;
  let scrollWidth;
  let childNodes;
  let scrollLeft;
  let scrollLeftMax;
  let scrollRatio;
  let sbEl;
  let isLocked;

  update();

  function hasScrollBar() {
    return sbEl !== undefined;
  }

  function targetOnMouseWheel(e) {
    if (!isLocked && abs(e.deltaX) > abs(e.deltaY)) {
      e.preventDefault();
      scrollLeft = scrollBy(e.deltaX);
    }
  }

  function scrollBarOnMouseDown(e) {
    if (isLocked) {
      return;
    }
    isLocked = true;

    let clientX = e.clientX;
    let currScrollLeft = scrollLeft;

    function onMouseMove(e) {
      currScrollLeft = scrollBy(e.clientX - clientX);
    }

    function onMouseUp(e) {
      sbEl.classList.remove('scrollbar--active');
      scrollLeft = currScrollLeft;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      isLocked = false;
    };

    sbEl.classList.add('scrollbar--active');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  function targetOnTouchStart(e) {
    if (isLocked || e.touches.length > 1) {
      return;
    }
    isLocked = true;

    let clientX = e.touches[0].clientX;
    let clientY = e.touches[0].clientY;
    let currScrollLeft = scrollLeft;

    let isDetected = false;
    let isAllowed = false;

    function onTouchMove(e) {
      if (e.touches.length > 1) {
        return;
      }
      const dx = e.touches[0].clientX - clientX;
      if (!isDetected) {
        const dy = e.touches[0].clientY - clientY;
        if (abs(dx) > abs(dy)) {
          isAllowed = true;
        }
        isDetected = true;
      }
      if (isAllowed) {
        currScrollLeft = scrollBy(-dx);
      }
    };

    function onTouchEnd(e) {
      isLocked = false;
      scrollLeft = currScrollLeft;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchen', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    }

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
  }

  function addScrollBar() {
    sbEl = document.createElement('div');
    sbEl.classList.add('scrollbar');
    sbEl.classList.add('scrollbar--horizontal');
    targetEl.style.touchAction = 'pan-y';

    updateScrollBar();
    targetEl.appendChild(sbEl);

    targetEl.addEventListener('wheel', targetOnMouseWheel);
    targetEl.addEventListener('touchstart', targetOnTouchStart);
    sbEl.addEventListener('mousedown', scrollBarOnMouseDown);
  }

  function updateScrollBar() {
    const scrollBarWidth = max(
        floor( clientWidth * clientWidth / scrollWidth ),
        MIN_SCROLLBAR_WIDTH
      );
    scrollRatio = (scrollWidth - clientWidth) / (clientWidth - scrollBarWidth);
    scrollLeftMax = clientWidth - scrollBarWidth;

    sbEl.style.width = scrollBarWidth + 'px';

    [sbEl, ...childNodes].forEach((el) => el.style.willChange = 'transform');
  }

  function removeScrollBar() {
    targetEl.removeEventListener('wheel', targetOnMouseWheel);
    targetEl.removeEventListener('touchstart', targetOnTouchStart);
    sbEl.removeEventListener('mousedown', scrollBarOnMouseDown);

    targetEl.removeChild(sbEl);
    sbEl = undefined;
    resetScroll();
  }

  function scrollBy(dx) {
    const sdx = dx > 0
        ? min(scrollLeft + dx, scrollLeftMax)
        : max(scrollLeft + dx, 0);
    sbEl.style.transform = `translateX(${sdx}px)`;
    scrollContentTo(-1 * sdx * scrollRatio);
    return sdx;
  }

  function scrollContentTo(x) {
    childNodes.forEach((childEl) => {
      childEl.style.transform = `translateX(${x}px)`;
    });
  }

  function resetScroll() {
    if (sbEl) {
      sbEl.style.transform = `translateX(0)`;
    }
    scrollContentTo(0);
    scrollLeft = 0;
    isLocked = false;
  }

  function update() {
    const style = getComputedStyle(targetEl);
    clientWidth = targetEl.clientWidth -
        parseInt(style.getPropertyValue('padding-left')) -
        parseInt(style.getPropertyValue('padding-right'));

    childNodes = Array.from(targetEl.childNodes).filter((childEl) => {
        return childEl !== sbEl;
      });
    scrollWidth = childNodes.reduce((maxWidth, childEl) => {
        return max(childEl.scrollWidth, maxWidth);
      }, 0);

    if (scrollWidth > clientWidth) {
      if (hasScrollBar()) {
        updateScrollBar();
      } else {
        addScrollBar();
      }
      resetScroll();
    } else {
      if (hasScrollBar()) {
        removeScrollBar();
      }
    }

  }

  const object = {
    update,
  };

  cache.set(targetEl, object);

  return object;

}

let isWatching = false;
let windowWidth;

const windowOnResize = throttle(() => {
  // Ignore the viewport height changes, `resize` often happens in the mobile browsers
  // after UI elements (eg. address bar) appear on the page.
  if (windowWidth === window.innerWidth) {
    return;
  }
  windowWidth = window.innerWidth;

  const els = Array.from( document.querySelectorAll('.scrollable--enabled') );
  els.forEach((el) => {
    const o = cache.get(el);
    if (o) {
      o.update();
    }
  });

  if (els.length === 0) {
    stopWatching();
  }
});

function startWatching() {
  if (!isWatching) {
    isWatching = true;
    windowWidth = window.innerWidth;
    window.addEventListener('resize', windowOnResize);
  }
}

function stopWatching() {
  isWatching = false;
  window.removeEventListener('resize', windowOnResize);
}

export default function scrollbar(root = document) {

  const els = Array.from( root.querySelectorAll('.scrollable:not(.scrollable--enabled)') );

  els.forEach((el) => {
    el.classList.add('scrollable--enabled');
    scrollable(el);
  });

  if (els.length) {
    startWatching();
  }

}
