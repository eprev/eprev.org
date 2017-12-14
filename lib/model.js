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

class Model {
  constructor() {

    this.documents = [];
    this.collections = [];

    if (!config.documents) {
      config.documents = [];
    }

    readdir('/', {
      root: config.src,
      exclude: config.exclude,
    }).forEach(pathname => {
      const doc = {
        pathname,
      };
      if (/\.md$/.test(pathname)) {
        const source = fs.readFileSync(path.join(config.src, pathname), {
          encoding: 'utf8',
        });
        const { content, meta } = markdown(source, {
          baseUrl: config.site.url + doc.pathname,
        });
        Object.assign(doc, meta, {
          content,
        });
      }
      for (let [pattern, fn] of config.documents) {
        const match = pattern.exec(pathname);
        if (match) {
          fn(doc, match);
          continue;
        }
      }
      this.documents[pathname] = doc;
    }, {});

    Object.values(this.documents).map(doc => this.register(doc));
    // TODO: sort collections by date
  }

  register(doc) {
    const { type } = doc;
    if (type) {
      if (!this.collections[type]) {
        this.collections[type] = [];
      }
      this.collections[type].push(doc);
    }
    return doc;
  }
}

module.exports = new Model();
