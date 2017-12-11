const config = require('../config');

const fs = require('fs');
const path = require('path');

function readdir(dirname) {
  return fs.readdirSync(dirname, {encoding: 'utf8'}).map((filename) => {
    const pathname = path.join(dirname, filename);
    const stats = fs.statSync(pathname);
    let contents;
    if (stats.isDirectory()) {
      contents = readdir(pathname);
    // console.log(filename, stat);
    }
    return {filename, stats, contents};
  });
}

exports.get = function () {
  const files = readdir(config.public);
  console.log(
    require('util').inspect(files, {colors: true, depth: 10})
  );
};
