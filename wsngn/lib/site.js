import fs from 'fs';
import path from 'path';

const { default: config } = await import(path.join(process.cwd(), 'config.js'));

import frontMatter from './front-matter.js';
import parseMarkdown from './markdown.js';
import memoize from './memoize.js';
import processMarkdown from './markdown-processor.js';
import renderMarkdown from './markdown-render.js';
import debug from '../lib/debug.js';

/**
 * @param {string} dirname
 * @param {{root: string, exclude: string[]}} options
 */
function readdir(dirname, options) {
  const { root, exclude } = options;
  return fs.readdirSync(path.join(root, dirname), { encoding: 'utf8' }).reduce(
    /**
     * @param {[string, Date][]} acc
     * @param {string} filename
     */
    (acc, filename) => {
      // do not include "hidden" files
      if (filename.startsWith('.')) {
        return acc;
      }
      // Do not include if the pathname matches one from the `exclude` option
      const pathname = path.join(dirname, filename);
      if (exclude && exclude.some((prefix) => pathname.startsWith(prefix))) {
        return acc;
      }
      const stats = fs.statSync(path.join(root, pathname));
      if (stats.isDirectory()) {
        acc = acc.concat(readdir(pathname, options));
      } else {
        acc.push([pathname, stats.mtime]);
      }
      return acc;
    },
    [],
  );
}

/** @type {(a: unknown, b: unknown) => number} */
function compare(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a > b ? 1 : a === b ? 0 : -1;
  } else {
    return Number(a) - Number(b);
  }
}

/**
 * @template [T=object]
 * @extends {Array<T>}
 */
export class Collection extends Array {
  /** @param {T[]} args */
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

  /**
   * @param {keyof T} key
   * @returns {T[]}
   * */
  ascBy(key) {
    return this.slice().sort((a, b) => compare(a[key], b[key]));
  }

  /**
   * @param {keyof T} key
   * @returns {T[]}
   * */
  descBy(key) {
    return this.slice().sort((a, b) => compare(b[key], a[key]));
  }
}

/** @typedef {{
 *   __name__?: string, // source file pathname (as if the document is an existing file)
 *   pathname: string,  // destination pathname
 *   mime?: string,
 *   type?: "page" | string,
 *   layout?: string,
 *   draft?: boolean, // drafts will not be published if env=production
 *   skip?: boolean,
 *   title?: string,
 *   source?: string, // template source (eg. homepage)
 *   content?: string, // processed file content (eg. html)
 *   __source__?: string, // file raw content (eg. markdown)
 *   [key: string]: unknown
 * }} Document */

/** @typedef {[RegExp, (doc: Document, match: RegExpExecArray) => void]} RewriteFunction */

/** @type {RewriteFunction[]} */
const rewrites = config.rewrites || [];

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');

const processFile = memoize(
  /**
   * @param {string} pathname
   * @param {Date} mtime
   */
  async function processFile(pathname, mtime) {
    debug.info('Found', pathname);
    /** @type {Document} */
    const doc = {
      __name__: pathname, // original pathname (eg. "/archive.tmpl.js")
      pathname, // final pathname (eg. "/archive/")
      [customInspectSymbol](depth, options, inspect) {
        if (
          depth <= 1 ||
          (Object.keys(this).length === 2 && this.pathname === this.__name__)
        ) {
          return options.stylize('Document', 'special') + ' ' + this.__name__;
        } else {
          return inspect(
            structuredClone({
              ...this,
              ...(this.__source__ && {
                __source__: '<...>',
              }),
            }),
            options,
          );
        }
      },
    };
    for (let [pattern, rewriteFn] of rewrites) {
      const match = pattern.exec(pathname);
      if (match) {
        debug.info('Match', pattern);
        rewriteFn(doc, match);
        debug.debug('Rewrite', doc);
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
      debug.debug('Front Matter', info);
      if (info.mime == 'text/markdown') {
        // Parse markdown and pull its header out (it goes to `defaults`)
        const [defaults, tokens] = processMarkdown(parseMarkdown(source));
        // Render markdown (no title)
        const content = await renderMarkdown(tokens, {
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
      } else if (info.mime == 'application/javascript') {
        Object.assign(doc, {
          ...info,
          __source__: source,
        });
      } else {
        Object.assign(doc, {
          ...info,
          content: source,
        });
      }
    }
    return doc;
  },
);

/**
 * @template [T=Record<string, unknown> | undefined]
 */
export class Site {
  /** @param {T} config */
  constructor(config) {
    /** @type {T} */
    this.config = config;

    // Build time
    this.time = new Date();

    /** @type {{[pathname: string]: Document}} */
    this.files = {};

    /** @type {{[type: string]: Document[]}} */
    this.types = {};

    debug.info('Site', config);
  }

  async build() {
    const files = readdir('/', {
      root: config.src,
      exclude: config.exclude,
    });
    await Promise.all(
      files.map(async ([pathname, mtime]) => {
        const doc = await processFile(pathname, mtime);
        if (doc.skip) {
          debug.info('Skip', pathname);
        } else {
          this.files[pathname] = this.register(doc);
        }
      }),
    );
  }

  /**
   * @template {Document} D
   * @param {D} doc
   * @returns {D}
   * */
  register(doc) {
    if (config.env === 'production' && doc.draft) {
      if (debug.level == 'debug') {
        debug.debug('Ignore (draft)', doc);
      } else {
        debug.info('Ignore (draft)');
      }
      return doc;
    }
    debug.debug('Register', doc);
    const { type } = doc;
    if (type) {
      if (!this.types[type]) {
        this.types[type] = [];
      }
      this.types[type].push(doc);
    }
    return doc;
  }

  /** @param {string} type */
  byType(type) {
    return new Collection(this.types[type] || []);
  }
}
