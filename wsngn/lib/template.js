import fs from 'fs';
import path from 'path';

import htmlMinifier from './html-minifier.js';
import { Site } from './site.js';

const workingDir = process.cwd();
const templateDir = path.resolve(workingDir, 'templates');

class TemplateError extends Error {}

const escapeChars = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

const escapeJSChars = {
  '<': '\\u003C',
  '>': '\\u003E',
};

/** @param {string} str */
function escape(str) {
  if (/[&<>"]/.test(str)) {
    return str.replace(/[&<>"]/g, (ch) => escapeChars[ch]);
  }
  return str;
}

/** @param {any} str */
function stringify(str) {
  const js = JSON.stringify(str);
  if (/[<>]/.test(js)) {
    return js.replace(/[<>]/g, (ch) => escapeJSChars[ch]);
  }
  return js;
}

/** @type {(strings: TemplateStringsArray, ...keys: any[]) => Promise<string>} */
export async function html(strings, ...keys) {
  // html.output += strings[0];
  let ret = strings[0];
  for (let i = 0; i < keys.length; i++) {
    let key = await Promise.resolve(keys[i]);
    if (typeof key === 'function') {
      key = await key();
    }
    if (Array.isArray(key)) {
      ret += (await Promise.all(key)).join('');
    } else {
      ret += (await Promise.resolve(key)) || '';
    }
    ret += strings[i + 1];
  }
  return ret;
}
// html.output = '';

/** @typedef {(pathname: string, params?: Record<string, unknown>) => Promise<string | undefined>} TemplateRender */

/** @typedef {{
 *   [key: string]: unknown,
 *   __name__?: string,
 *   __dirname__?: string,
 *   html?: typeof html,
 *   escape?: typeof escape,
 *   stringify?: typeof stringify,
 *   url?: (pathname: string) => string,
 *   require?: (pathname: string) => string,
 *   read?: (pathname: string) => string | undefined,
 *   render?: TemplateRender,
 *   __build_id__?: string,
 *   site?: Site
 * }} TemplateContext */

/** @typedef {(context: Required<TemplateContext>) => Promise<string | undefined>} TemplateFunction */

/** @type {(name: string, context: TemplateContext) => Promise<string | undefined>} */
export async function render(name, context) {
  let filepath;
  if (path.isAbsolute(name)) {
    if (!context.__name__) {
      context.__name__ = name;
    }
    filepath = name;
  } else {
    context.__name__ = `<${name}>`;
    filepath = path.join(templateDir, name + '.tmpl.js');
  }
  context.__dirname__ = path.dirname(filepath);
  // const tmpl = fs.readFileSync(filepath, 'utf8');
  // return await renderString(tmpl, context);
  context.require = (pathname) => {
    if (context.__dirname__ == undefined) {
      throw new TemplateError('require: {string} __dirname__ is equired');
    }
    return require(pathname.startsWith('.')
      ? path.join(context.__dirname__, pathname)
      : pathname);
  };
  context.html = html;
  context.escape = escape;
  context.stringify = stringify;
  context.url = function (pathname) {
    if (
      typeof context.site != 'object' ||
      typeof context.site?.config?.['url'] != 'string'
    ) {
      throw new TemplateError('url() requires {string} site.config.url');
    }
    return (
      context.site.config['url'] +
      (pathname.startsWith('/') ? pathname : '/' + pathname)
    );
  };
  context.render = async function (name, params) {
    return render(name, { ...context, ...params });
  };
  context.read = function (pathname) {
    if (context.__dirname__ == undefined) {
      throw new TemplateError('read: {string} __dirname__ is required');
    }
    try {
      return fs.readFileSync(path.join(context.__dirname__, pathname), 'utf8');
    } catch (e) {}
  };

  // const keys = Object.keys(context);
  // const values = Object.values(context);
  // let fn;
  try {
    const { default: fn } = await import(filepath + '?' + context.__build_id__);
    if (fn instanceof Function) {
      // TODO: const html = await /** @type {TemplateFunction} */ (fn)(context);
      const html = await fn(context);
      return html ? htmlMinifier(html) : undefined;
    }
    // // html.output = '';
    // fn = Function.prototype.constructor.apply(
    //   Object.create(Function.prototype),
    //   [...keys, tmpl],
    // );
    // // fn.apply(null, values);
    // // return htmlMinifier(html.output);
    // return htmlMinifier(fn.apply(null, values));
  } catch (e) {
    if (e instanceof TemplateError) {
      throw e;
    } else if (e instanceof Error) {
      // throw e;
      // const match = e.stack
      //   ? /eval.*?<anonymous>:(\d+):(\d+)/.exec(e.stack)
      //   : undefined;
      // if (match) {
      //   const [_, line, column] = match;
      //   const lines = fn.toString().split('\n');
      //   const message =
      //     e.message +
      //     ' in "' +
      //     context.__name__ +
      //     '"\n' +
      //     lines[Number(line) - 1] +
      //     '\n' +
      //     (' '.repeat(Number(column) - 1) + '^');
      //   throw new TemplateError(message);
      // } else {
      const message = e.message + ' in "' + context.__name__ + '"\n';
      throw new TemplateError(message, { cause: e });
      // }
    }
  }
}
