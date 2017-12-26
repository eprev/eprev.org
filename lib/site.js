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

function compare(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a > b ? 1 : a === b ? 0 : -1;
  } else {
    return a - b;
  }
}

class Collection extends Array {
  constructor(args = []) {
    super();
    this.push(...args);
  }
  // As the collection's constructor differs from the array's one,
  // this may lead to the unexpected results if array's methods are called
  // as they may need to create a new instance.
  static get [Symbol.species]() {
    return Array;
  }
  sortAsc(property) {
    return new Collection(
      this.slice().sort((a, b) => compare(a[property], b[property])),
    );
  }
  sortDesc(property) {
    return new Collection(
      this.slice().sort((a, b) => compare(b[property], a[property])),
    );
  }
}

exports.Collection = Collection;

class Site {
  constructor(properties) {
    Object.assign(this, properties);

    this.time = new Date();

    this.files = [];
    this.types = [];

    if (!config.rewrites) {
      config.rewrites = [];
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
      for (let [pattern, fn] of config.rewrites) {
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
      this.files[pathname] = doc;
    }, {});

    Object.values(this.files).map(doc => this.register(doc));
  }

  register(doc) {
    const { type } = doc;
    if (type) {
      if (!this.types[type]) {
        this.types[type] = [];
      }
      this.types[type].push(doc);
    }
    return doc;
  }

  byType(type) {
    return new Collection(this.types[type] || []);
  }
}

exports.Site = Site;
