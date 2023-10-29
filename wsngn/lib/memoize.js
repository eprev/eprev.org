/**
 * @template {{
 *   (...args: any[]): any,
 *   memoize?: Record<string, any>
 * }} T
 * @param {T} fn
 * @returns {(...args: Parameters<T>) => ReturnType<T>}
 */
export default function memoize(fn) {
  return function (...args) {
    const key = args
      .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
      .join(':');
    if (!fn.memoize) {
      fn.memoize = {};
    }
    if (key in fn.memoize) {
      return fn.memoize[key];
    } else {
      return (fn.memoize[key] = fn(...args));
    }
  };
}
