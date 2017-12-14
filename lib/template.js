const fs = require('fs');
const path = require('path');

const config = require('../config');

const templateDir = path.join(__dirname, '..', 'templates');

const html = (exports.html = function(strings, ...keys) {
  let result = strings[0];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result += (Array.isArray(key) ? key.join('') : (key || '')) + strings[i + 1];
  }
  return result;
});

const renderString = function(tmpl, context) {
  context.html = html;
  context.url = function(pathname) {
    return context.site.url + (pathname.startsWith('/') ? pathname : '/' + pathname);
  };
  context.render = function(name, params) {
    return render(name, Object.assign({}, context, params));
  };
  const keys = Object.keys(context);
  const values = Object.values(context);
  const fn = Function.prototype.constructor.apply(
    Object.create(Function.prototype),
    [...keys, tmpl],
  );
  return fn.apply(null, values);
}

const render = (exports.render = function(name, context) {
  const tmpl = fs.readFileSync(path.join(templateDir, name + '.tmpl'), 'utf8');
  return renderString(tmpl, context);
});
