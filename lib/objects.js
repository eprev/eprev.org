const config = require('../config');
const markdown = require('./markdown');
const { renderFile } = require('./template');

const fs = require('fs');
const path = require('path');

function readdir(dirname, options) {
  const { root, exclude } = options;
  return fs
    .readdirSync(path.join(root, dirname), { encoding: 'utf8' })
    .reduce((acc, filename) => {
      if (exclude && exclude.test(filename)) {
        return acc;
      }
      const pathname = path.join(dirname, filename);
      const stats = fs.statSync(path.join(root, pathname));
      if (stats.isDirectory()) {
        acc = acc.concat(readdir(pathname, options));
      } else {
        acc.push(pathname);
      }
      return acc;
    }, []);
}

exports.get = function() {
  const files = readdir('/', { root: config.src, exclude: config.exclude });
  if (!config.objects) {
    config.objects = [];
  }
  const objects = files.reduce((objects, pathname) => {
    const object = {
      pathname,
    };
    for (let [pattern, fn] of config.objects) {
      const match = pattern.exec(pathname);
      if (match) {
        fn(object, match);
        continue;
      }
    }
    objects[pathname] = object;
    return objects;
  }, {});
  const collections = Object.keys(objects).reduce((collections, pathname) => {
    const object = objects[pathname];
    const type = object.type;
    if (type) {
      if (!collections[type]) {
        collections[type] = [];
      }
      if (/\.md$/.test(pathname)) {
        const source = fs.readFileSync(path.join(config.src, pathname), {
          encoding: 'utf8',
        });
        const { content, meta } = markdown(source, {
          baseUrl: config.site.url + object.pathname,
        });
        collections[type].push(
          Object.assign(object, meta, {
            content,
          }),
        );
      }
    }
    // TODO: sort collections by date
    return collections;
  }, {});

  return { objects, collections };
};
