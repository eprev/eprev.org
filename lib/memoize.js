module.exports = function memoize(fn) {
  return function(...args) {
    const key = args
      .map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
      .join(':');
    if (!('memoize' in fn)) {
      fn.memoize = {};
    }
    if (key in fn.memoize) {
      return fn.memoize[key];
    } else {
      return (fn.memoize[key] = fn(...args));
    }
  };
};
