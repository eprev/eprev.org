const fs = require('fs');
const path = require('path');

function readdir(dirname, fn) {
  return fs.readdirSync(dirname, { encoding: 'utf8' }).forEach(filename => {
    // Do not include "hidden" files
    if (filename.startsWith('.')) return;
    const pathname = path.join(dirname, filename);
    const stats = fs.statSync(pathname);
    if (stats.isDirectory()) {
      readdir(pathname, fn);
    } else {
      fn(pathname);
    }
  });
}

module.exports = function(dirname, listener) {
  readdir(dirname, pathname => {
    fs.watch(pathname, { encoding: 'utf8' }, listener);
  });
};
