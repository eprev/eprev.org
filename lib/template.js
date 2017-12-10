const html = exports.html = function (strings, ...keys) {
  let result = strings[0];
  for (let i = 0; i < keys.length; i++) {
    result += keys[i] + strings[i + 1];
  }
  return result;
};

const fs = require('fs');
const path = require('path');

const render = exports.render = function(name, o) {
  const tmpl = fs.readFileSync(path.join(__dirname, '..', 'templates', name + '.js'))
  o.html = html;
  o.url = function (pathname) {
    return '/' + pathname;
  };
  o.render = function (name, params) {
    return render(name, Object.assign({}, o, params));
  };
  const keys = Object.keys(o);
  const values = Object.values(o);
  const fn = Function.prototype.constructor.apply(Object.create(Function.prototype), [...keys, 'return ' + tmpl]);
  return fn.apply(null, values);
};
