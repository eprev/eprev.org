const config = require('../config');
const markdown = require('./markdown');
const { renderFile } = require('./template');

const fs = require('fs');
const path = require('path');

function readdir(dirname, options) {
  const { root, exclude } = options;
  return fs
    .readdirSync(path.join(root, dirname), { encoding: 'utf8' })
    .reduce((acc, filename) => {
      if (exclude && exclude.test(filename)) {
        return acc;
      }
      const pathname = path.join(dirname, filename);
      const stats = fs.statSync(path.join(root, pathname));
      if (stats.isDirectory()) {
        acc = acc.concat(readdir(pathname, options));
      } else {
        acc.push(pathname);
      }
      return acc;
    }, []);
}

// class File {
//   constructtor(pathname) {
//     this.pathname = pathname;
//   }
// }
//
exports.get = function() {
  const files = readdir('/', { root: config.public, exclude: config.exclude });
  if (!config.objects) {
    config.objects = [];
  }
  const objects = files.reduce((objects, pathname) => {
    const object = {
      pathname,
    };
    for (let [pattern, fn] of config.objects) {
      const match = pattern.exec(pathname);
      if (match) {
        fn(object, match);
        continue;
      }
    }
    objects[pathname] = object;
    return objects;
  }, {});
  // if (config.collections) {
  //   Object.keys(config.collections).forEach(name => {
  //     const settings = config.collections[name];
  //     collections[name] = [];
  //     if (settings.rewrite) {
  //       const [match, repl] = settings.rewrite;
  //       files.forEach(file => {
  //         if (!mapping[file] && match.test(file)) {
  //           mapping[file] = file.replace(match, repl);
  //           if (/\.md$/.test(file)) {
  //             // TODO: date
  //             const source = fs.readFileSync(path.join(config.public, file), {
  //               encoding: 'utf8',
  //             });
  //             const { content, meta } = markdown(source, {
  //               baseUrl: config.site.url + mapping[file],
  //             });
  //             collections[name].push(
  //               Object.assign({}, meta, {
  //                 url: mapping[file],
  //                 content,
  //               }),
  //             );
  //           } else if (/\.tmpl$/.test(file)) {
  //             collections[name].push(
  //               Object.assign({}, {
  //                 url: mapping[file],
  //                 template: file,
  //               }),
  //             );
  //           }
  //         }
  //       });
  //     }
  //   });
  // }
  // let routes = Object.keys(mapping).reduce((acc, file) => {
  //   acc[mapping[file]] = file;
  //   return acc;
  // }, {});

  // Object.keys(collections).forEach((name) => {
  //   let collection = collections[name];
  //   collection.forEach((collection) => {
  //     if (collection.template) {
  //       // console.log(renderFile(collection.template, {collections}));
  //     }
  //   });
  // });

  // return { collections, files: mapping, routes };
  return objects;
};
