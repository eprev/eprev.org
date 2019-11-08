const fs = require('fs');
const path = require('path');

const htmlMinifier = require('./html-minifier');

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

function escape(str) {
  if (/[&<>"]/.test(str)) {
    return str.replace(/[&<>"]/g, ch => escapeChars[ch]);
  }
  return str;
}

function stringify(str) {
  const js = JSON.stringify(str);
  if (/[<>]/.test(js)) {
    return js.replace(/[<>]/g, ch => escapeJSChars[ch]);
  }
  return js;
}

const html = (exports.html = function html(strings, ...keys) {
  let result = strings[0];
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (typeof key === 'function') {
      key = key();
    }
    result += (Array.isArray(key) ? key.join('') : key || '') + strings[i + 1];
  }
  return result;
});

const renderString = (exports.renderString = function(tmpl, context) {
  context.require = function(pathname) {
    return require(pathname.startsWith('.')
      ? path.join(context.__dirname__, pathname)
      : pathname);
  };
  context.html = html;
  context.escape = escape;
  context.stringify = stringify;
  context.url = function(pathname) {
    return (
      context.site.url + (pathname.startsWith('/') ? pathname : '/' + pathname)
    );
  };
  context.render = function(name, params) {
    return render(name, Object.assign({}, context, params));
  };
  context.read = function(pathname) {
    try {
      return fs.readFileSync(path.join(context.__dirname__, pathname), 'utf8');
    } catch (e) {}
  };

  const keys = Object.keys(context);
  const values = Object.values(context);
  let fn;
  try {
    fn = Function.prototype.constructor.apply(
      Object.create(Function.prototype),
      [...keys, tmpl],
    );
    return htmlMinifier(fn.apply(null, values));
  } catch (e) {
    if (e instanceof TemplateError) {
      throw e;
    }
    const match = /eval.*?<anonymous>:(\d+):(\d+)/.exec(e.stack);
    if (match) {
      const [_, line, column] = match;
      const lines = fn.toString().split('\n');
      const message =
        e.message +
        ' in "' +
        context.__name__ +
        '"\n' +
        lines[line - 1] +
        '\n' +
        (' '.repeat(column - 1) + '^');
      throw new TemplateError(message);
    } else {
      const message = e.message + ' in "' + context.__name__ + '"\n';
      throw new TemplateError(message);
    }
  }
});

const render = (exports.render = function(name, context) {
  context.__name__ = `<${name}>`;
  const filepath = path.join(templateDir, name + '.tmpl');
  context.__dirname__ = path.dirname(filepath);
  const tmpl = fs.readFileSync(filepath, 'utf8');
  return renderString(tmpl, context);
});
