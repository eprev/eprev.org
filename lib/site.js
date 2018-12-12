const fs = require('fs');
const path = require('path');

const config = require('../config');
const frontMatter = require('./front-matter');
const parseMarkdown = require('./markdown');
const memoize = require('./memoize');
const processMarkdown = require('./markdown-processor');
const renderMarkdown = require('./markdown-render');

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
        acc.push([pathname, stats.mtime]);
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

const rewrites = config.rewrites || [];

const process = memoize(function process(pathname, mtime) {
  // console.info('Read', pathname);
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
      // Parse markdown and pull its header out (it goes to `defaults`)
      const [defaults, tokens] = processMarkdown(parseMarkdown(source));
      // Render markdown (no title)
      const content = renderMarkdown(tokens, {
        baseUrl: config.site.url + doc.pathname,
        baseDir: path.join(config.src, path.dirname(pathname)),
      });
      // Title pulled out from the content (`defaults`) can be replaced
      // with the one specified in the front-matter (`info`)
      Object.assign(doc, {
        ...defaults,
        ...info,
        content,
        __source__: source,
      });
    } else {
      Object.assign(doc, {
        ...info,
        source,
      });
    }
  }
  return doc;
});

class Site {
  constructor(properties) {
    Object.assign(this, properties);

    // Build time
    this.time = new Date();

    this.files = [];
    this.types = [];

    readdir('/', {
      root: config.src,
      exclude: config.exclude,
    }).forEach(([pathname, mtime]) => {
      const doc = process(pathname, mtime);
      if (!doc.skip) {
        this.files[pathname] = this.register(doc);
      }
    });

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
