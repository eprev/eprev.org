const config = require('../config');
const fm = require('./front-matter');
const markdown = require('./markdown');

const fs = require('fs');
const path = require('path');

function readdir(dirname, options) {
  const { root, exclude } = options;
  return fs
    .readdirSync(path.join(root, dirname), { encoding: 'utf8' })
    .reduce((acc, filename) => {
      if (filename.startsWith('.')) {
        return acc;
      }
      const pathname = path.join(dirname, filename);
      if (exclude && exclude.some(prefix => pathname.startsWith(prefix))) {
        return acc;
      }
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
      const matter = fm(path.join(config.src, pathname));
      const doc = {
        __name__: pathname,
        pathname,
      };
      for (let [pattern, fn] of config.documents) {
        const match = pattern.exec(pathname);
        if (match) {
          fn(doc, match);
          continue;
        }
      }
      if (matter) {
        if (!doc.type) {
          doc.type = 'page';
        }
        const [info, source] = matter;
        if (info.mime == 'text/markdown') {
          const { content, meta } = markdown(source, {
            baseUrl: config.site.url + doc.pathname,
            baseDir: path.join(config.src, path.dirname(pathname)),
          });
          Object.assign(doc, meta, info, {
            content,
          });
        } else {
          Object.assign(doc, info, {
            source,
          });
        }
      }
      this.documents[pathname] = doc;
    }, {});

    Object.values(this.documents).map(doc => this.register(doc));
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

exports.Model = Model;
