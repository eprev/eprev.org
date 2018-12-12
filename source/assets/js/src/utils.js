export function throttle(fn, context) {
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

export function debounce(fn, delay = 50, context) {
  let timeOut;
  return function debounced(...args) {
    if (timeOut) {
      clearTimeout(timeOut);
    }
    timeOut = setTimeout(() => {
      timeOut = undefined;
      fn.apply(context, args);
    }, delay);
  };
}
