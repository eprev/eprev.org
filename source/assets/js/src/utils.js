/** @type {<T extends (...args: any) => any>(fn: T, context?: any) => (...args: Parameters<T>) => void} */
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

/** @type {<T extends (...args: any) => any>(fn: T, delay: number, context?: any) => (...args: Parameters<T>) => void} */
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
