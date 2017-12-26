const fs = require('fs');
const path = require('path');
const properties = require('../lib/properties');
const { Collection } = require('../lib/site');

module.exports = function({ generate, site }) {
  const tagName = properties(
    fs.readFileSync(path.join(__dirname, 'tags.txt'), 'utf8'),
  );
  const tags = {};
  Object.values(site.files).forEach(doc => {
    if (doc.type == 'post' && doc.tags) {
      doc.tags.forEach(tag => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(doc);
      });
    }
  });
  site.types['tag'] = Object.keys(tags).map(tag => {
    const posts = new Collection(tags[tag]);
    const page = site.register({
      id: tag, // Used for sorting
      type: 'page', // To make it to sitemap.xml
      pathname: `/tags/${tag}/`,
      title: tagName[tag] || tag[0].toUpperCase() + tag.slice(1),
      posts,
    });
    generate(`/tags/${tag}/index.html`, 'tag', page);
    return page;
  });
};
