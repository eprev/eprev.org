module.exports = function({ generate, model, config }) {
  const tags = {};
  Object.values(model.documents).forEach(doc => {
    if (doc.type == 'post' && doc.tags) {
      doc.tags.forEach(tag => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(doc);
      });
    }
  });
  config.site.tags = Object.keys(tags).map(tag => {
    const posts = tags[tag];
    const page = model.register({
      type: 'page',
      pathname: `/tags/${tag}/`,
      title: tag,
      posts,
    });
    generate(`/tags/${tag}/index.html`, 'tag', page);
    return page;
  });
  generate(
    '/tags/index.html',
    'tags',
    model.register({
      type: 'page',
      title: 'Tags',
      pathname: '/tags/',
    }),
  );
};
