module.exports = function props(s, { transform = false } = {}) {
  return s && s.split(/\n+(?=\S|$)/g).reduce((acc, line) => {
    if (line) {
      let [key, value] = line.split(/ *: */);
      if (value.includes('\n')) {
        value = value.split(/\n+ +- +/).slice(1);
      }
      if (transform) {
        key = key.replace(/-(.)/g, (_, ch) => ch.toUpperCase());
      }
      acc[key] = value;
    }
    return acc;
  }, {});
};
