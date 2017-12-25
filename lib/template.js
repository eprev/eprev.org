const fs = require('fs');
const path = require('path');

const templateDir = path.join(__dirname, '..', 'templates');

class TemplateError extends Error {}

const escapeChars = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function escape(str) {
  if (/[&<>"]/.test(str)) {
    return str.replace(/[&<>"]/g, ch => escapeChars[ch]);
  }
  return str;
}

const html = (exports.html = function(strings, ...keys) {
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

const renderString = exports.renderString = function(tmpl, context) {
  context.require = function(pathname) {
    return require(pathname.startsWith('.')
      ? path.join(templateDir, pathname)
      : pathname);
  };
  context.html = html;
  context.escape = escape;
  context.url = function(pathname) {
    return (
      context.site.url + (pathname.startsWith('/') ? pathname : '/' + pathname)
    );
  };
  context.render = function(name, params) {
    return render(name, Object.assign({}, context, params));
  };
  context.inline = function (pathname) {
    return fs.readFileSync(path.join(templateDir, context.__name__, pathname), 'utf8');
  };

  const keys = Object.keys(context);
  const values = Object.values(context);
  const fn = Function.prototype.constructor.apply(
    Object.create(Function.prototype),
    [...keys, tmpl],
  );
  try {
    return fn.apply(null, values);
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
        '\n' +
        lines[line - 1] +
        '\n' +
        (' '.repeat(column - 1) + '^');
      throw new TemplateError(message);
    } else {
      throw e;
    }
  }
};

const render = (exports.render = function(name, context) {
  context.__name__ = name;
  const tmpl = fs.readFileSync(path.join(templateDir, name + '.tmpl'), 'utf8');
  return renderString(tmpl, context);
});
