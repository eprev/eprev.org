const fs = require('fs');
const { extname } = require('path');
const mime = require('./mime');

module.exports = function(pathname) {
  const ext = extname(pathname);
  const mimeType = mime[ext];
  if (/^text|(x|ht)ml$/.test(mimeType)) {
    const source = fs.readFileSync(pathname, { encoding: 'utf8' });
    const match = /^(?:<!|-)--\s*([\s\S]*?)\s*--(?:-|>)\n*([\s\S]*)$/.exec(
      source,
    );
    if (match) {
      const [_, fm, content] = match;
      const meta = fm.split(/\n+(?=\S)/g).reduce((acc, line) => {
        let [key, value] = line.split(/ *: */);
        if (value.includes('\n')) {
          value = value.split(/\n* *- */).slice(1);
        }
        key = key.replace(/-(.)/g, (_, ch) => ch.toUpperCase());
        acc[key] = value;
        return acc;
      }, {});
      if (!meta.mime) {
        meta.mime = mimeType;
      }
      return [meta, content];
    }
    return [{ mime: mimeType }, source];
  }
  return [{ mime: mimeType }, undefined];
};
