module.exports = function properties(s, { transform = false } = {}) {
  return s && s.split(/\n+(?=\S|$)/g).reduce((acc, line) => {
    if (line) {
      let [key, value] = line.split(/ *: */);
      if (value.includes('\n')) {
        const values = value.split(/\n+ +- +/);
        if (values.length === 1) {
          // If not a list, then concatenate lines
          value = value.replace(/\n */g, ' ');
        } else {
          // Return the list
          value = values.slice(1);
        }
      }
      if (transform) {
        key = key.replace(/-(.)/g, (_, ch) => ch.toUpperCase());
      }
      acc[key] = value;
    }
    return acc;
  }, {});
};
