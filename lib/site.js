const fs = require('fs');
const path = require('path');

const config = require('../config');
const frontMatter = require('./front-matter');
const markdown = require('./markdown');

function readdir(dirname, options) {
  const { root, exclude } = options;
  return fs
    .readdirSync(path.join(root, dirname), { encoding: 'utf8' })
    .reduce((acc, filename) => {
      // Do not include "hidden" files
      if (filename.startsWith('.')) {
        return acc;
      }
      // Do not include if the pathname matches one from the `exclude` option
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
  // in that they may need to create a new instance.
  static get [Symbol.species]() {
    return Array;
  }
  ascBy(key) {
    return this.slice().sort((a, b) => compare(a[key], b[key]));
  }
  descBy(key) {
    return this.slice().sort((a, b) => compare(b[key], a[key]));
  }
}

exports.Collection = Collection;

class Site {
  constructor(properties) {
    Object.assign(this, properties);

    // Build time
    this.time = new Date();

    this.files = [];
    this.types = [];

    const rewrites = config.rewrites || [];

    readdir('/', {
      root: config.src,
      exclude: config.exclude,
    }).forEach(pathname => {
      const doc = {
        __name__: pathname, // original pathname (eg. "/archive.tmpl")
        pathname, // final pathname (eg. "/archive/")
      };
      for (let [pattern, rewriteFn] of rewrites) {
        const match = pattern.exec(pathname);
        if (match) {
          rewriteFn(doc, match);
          break;
        }
      }
      const fm = frontMatter(path.join(config.src, pathname));
      if (fm) {
        // Any markdown or template file must have the front-matter
        if (!doc.type) {
          // Such file is a "page" by default
          doc.type = 'page';
        }
        const [info, source] = fm;
        if (info.mime == 'text/markdown') {
          const { content, meta } = markdown(source, {
            baseUrl: config.site.url + doc.pathname,
            baseDir: path.join(config.src, path.dirname(pathname)),
          });
          Object.assign(doc, {
            ...meta,
            ...info,
            content,
          });
        } else {
          Object.assign(doc, {
            ...info,
            source,
          });
        }
      }
      this.files[pathname] = doc;
    }, {});

    Object.values(this.files).forEach(doc => this.register(doc));
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
